import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { parseValue, text, idSchema, phoneSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { getCommissionRateForTier, getEffectiveDeliveryRadiusKm } from "@/lib/subscription-tiers";
import { getPlatformRules, MAINTENANCE_MESSAGE } from "@/lib/platform-rules";
import { calculateHaversineDistance, geocodeAddress } from "@/lib/geo";
import { runSerializableWithRetry } from "@/lib/with-serializable-retry";
import { refundPaystackPayment } from "@/lib/paystack";
import {
  createSecureTrackCode,
  CheckoutRequestBody,
  CheckoutPayloadItem,
} from "./utils";
import { getPaystackTransaction } from "./services";
import {
  getEffectivePrice,
  SALE_END_GRACE_MS,
  type SaleFields,
} from "@/lib/pricing";
import { notifyBusinessNewOrder } from "@/lib/notify-business";

/**
 * Thrown inside the transaction when a line item can't be fulfilled.
 * Throwing here aborts the WHOLE transaction — any stock already
 * decremented for earlier items in the loop is automatically rolled back
 * by Postgres, so partial decrements can never happen.
 */
class InsufficientStockError extends Error {
  constructor(
    public itemId: string,
    public itemName: string,
    public available: number,
    public requested: number,
  ) {
    super(
      `Insufficient stock for "${itemName}": requested ${requested}, only ${available} available`,
    );
    this.name = "InsufficientStockError";
  }
}

/**
 * Thrown inside the transaction when what Paystack actually confirms it
 * charged doesn't match what this order should legitimately cost, computed
 * server-side from real Item.price rows (never from the client payload).
 *
 * This is the fix for a pre-existing gap: this route used to trust
 * item.price and totalAmount straight from the request body, and the
 * checkout page separately passes a client-computed amount to Paystack at
 * payment-initiation time. Both numbers were entirely client-controlled —
 * someone with devtools open could submit (and actually get charged) any
 * price. This class closes that gap the same way InsufficientStockError
 * already does: reject inside the atomic transaction, then refund +
 * record as REFUNDED rather than silently fulfilling at an unverified price.
 */
class PriceMismatchError extends Error {
  constructor(
    public expectedTotal: number,
    public verifiedChargedAmount: number,
  ) {
    super(
      `Price mismatch: expected ₦${expectedTotal.toFixed(2)}, Paystack confirmed a charge of ₦${verifiedChargedAmount.toFixed(2)}`,
    );
    this.name = "PriceMismatchError";
  }
}

/**
 * Thrown when an order cannot be fulfilled for a reason other than stock or
 * price (unknown item, item from another business). The payment was already
 * captured, so the caller refunds it and records the order as REFUNDED.
 */
class OrderRejectedError extends Error {
  constructor(
    public reason: string,
    public customerMessage: string,
  ) {
    super(reason);
    this.name = "OrderRejectedError";
  }
}

const REFUND_NOTICE =
  "Your payment is being refunded and should reach your account within 3–10 business days.";

// Small tolerance for floating point / kobo-to-naira rounding — not a
// meaningful amount of money, just avoids false positives from rounding.
const PRICE_TOLERANCE_NAIRA = 1;

/**
 * Resolves the price this Item should actually be charged at. Currently
 * just the base Item.price — this is the intended hook point for
 * location-based catalog overrides (LocationItemOverride) once that
 * feature is built. Centralizing it here means the override only needs to
 * be wired in ONE place, not every call site that reads a price.
 */
function getEffectiveItemPrice(item: SaleFields): number {
  // Grace keeps a customer who started paying just before a sale ended from
  // being refunded over the price they were shown.
  return getEffectivePrice(item, new Date(), SALE_END_GRACE_MS);
}

export async function POST(request: NextRequest) {
  {
    const limited = await rateLimit(request, RATE_LIMITS.payment);
    if (limited) return limited;
  }
  try {
    console.log("------------------------------------------------");
    console.log("🚀 [FreshPoint API] ORDER CONFIRMATION INITIATED");

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.error(
        "❌ [FreshPoint API] Unauthorized access attempt (No Clerk Session)",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request
      .json()
      .catch(() => null)) as CheckoutRequestBody | null;
    if (!body) {
      console.error(
        "❌ [FreshPoint API] Failed to extract request body. Payload is empty.",
      );
      return NextResponse.json(
        { error: "Invalid JSON body request payload" },
        { status: 400 },
      );
    }

    const checkoutParse = parseValue(
      body,
      z.object({
        reference: text(100),
        businessId: idSchema,
        items: z
          .array(
            z.object({
              itemId: idSchema,
              quantity: z.coerce.number().int().min(1).max(1000),
              price: z.coerce.number().optional(),
            }),
          )
          .min(1)
          .max(100),
        isDelivery: z.boolean().optional(),
        deliveryAddress: z.string().trim().max(300).nullish(),
        deliveryLatitude: z.number().min(-90).max(90).nullish(),
        deliveryLongitude: z.number().min(-180).max(180).nullish(),
        deliveryNotes: z.string().trim().max(500).nullish(),
        customerPhone: phoneSchema.nullish(),
      }),
    );
    if (!checkoutParse.ok) return checkoutParse.response;
    const validatedBody = checkoutParse.data;
    const {
      reference,
      businessId,
      items,
      isDelivery,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryNotes,
      customerPhone, // Added for emergency contact tracking
    } = validatedBody;
    // NOTE: `totalAmount` and each item's `price` are intentionally NOT
    // destructured from the client body for use in calculations below —
    // both are re-derived server-side now. See PriceMismatchError above.

    console.log(
      `📊 [FreshPoint API] Incoming Checkout: Ref: ${reference} | Business: ${businessId}`,
    );

    if (
      !reference ||
      !businessId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      console.error(
        "❌ [FreshPoint API] Validation failed: Missing critical payload fields.",
      );
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 },
      );
    }

    // 0. IDEMPOTENCY GUARD: if this reference already produced an order,
    // return its existing state instead of re-verifying payment or
    // re-touching stock. Prevents double-decrement on retries/refreshes.
    const existingOrder = await prisma.order.findUnique({
      where: { id: reference },
      select: { id: true, code: true, status: true, userId: true },
    });

    if (existingOrder) {
      const referenceOwner = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (!referenceOwner || existingOrder.userId !== referenceOwner.id) {
        return NextResponse.json(
          { error: "Payment reference belongs to another user" },
          { status: 403 },
        );
      }
      console.log(
        `♻️ [FreshPoint API] Reference ${reference} already confirmed. Returning existing order without reprocessing.`,
      );
      return NextResponse.json(
        {
          success: existingOrder.status !== OrderStatus.REFUNDED,
          orderId: existingOrder.id,
          orderCode: existingOrder.code,
          status: existingOrder.status,
          idempotent: true,
        },
        { status: 200 },
      );
    }

    // 1. Fire Outbound Remote Payment Gate Verification Checks — now pulling
    // the FULL transaction payload (including the amount Paystack actually
    // confirms it charged), not just a yes/no.
    const verifiedTransaction = await getPaystackTransaction(reference);
    if (!verifiedTransaction) {
      return NextResponse.json(
        { error: "Payment verification failed or was declined by Paystack" },
        { status: 400 },
      );
    }
    // Paystack amounts are in kobo.
    const verifiedChargedAmountNaira = verifiedTransaction.amount / 100;

    console.log(
      "✅ [FreshPoint API] Paystack verification cleared cleanly. Resolving User record...",
    );

    // 2. Identify and validate the user context profile record
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      console.error(
        `❌ [FreshPoint API] Database reference mismatch: ClerkID ${clerkId} lacks user profile.`,
      );
      return NextResponse.json(
        { error: "User identity profile not found" },
        { status: 404 },
      );
    }

    // 2b. Resolve the business's commission rate — manual override takes
    // precedence, otherwise fall back to the rate for their subscription tier.
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        commissionRate: true,
        subscriptionTier: true,
        latitude: true,
        longitude: true,
        baseDeliveryFee: true,
        deliveryFeePerKm: true,
        deliveryRadiusKm: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const activeIsDelivery = Boolean(isDelivery);
    const activeAddress =
      activeIsDelivery && deliveryAddress
        ? String(deliveryAddress).trim()
        : null;
    let activeLatitude =
      activeIsDelivery && typeof deliveryLatitude === "number"
        ? deliveryLatitude
        : null;
    let activeLongitude =
      activeIsDelivery && typeof deliveryLongitude === "number"
        ? deliveryLongitude
        : null;
    const activeNotes =
      activeIsDelivery && deliveryNotes ? String(deliveryNotes).trim() : null;
    const activePhone = customerPhone ? String(customerPhone).trim() : null;

    let activeFee = 0;

    // 3. Execute unique code-collision fallback resolution loops
    let friendlyCode = "";
    let isUniqueFound = false;
    let collisionSafetyAttempts = 0;
    const maxSafetyThreshold = 5;

    while (!isUniqueFound && collisionSafetyAttempts < maxSafetyThreshold) {
      friendlyCode = createSecureTrackCode();

      const duplicateCheck = await prisma.order.findFirst({
        where: { code: friendlyCode },
        select: { id: true },
      });

      if (!duplicateCheck) {
        isUniqueFound = true;
      } else {
        collisionSafetyAttempts++;
        console.warn(
          `⚠️ [FreshPoint API] Collision for code [${friendlyCode}]. Retry attempt [${collisionSafetyAttempts}/${maxSafetyThreshold}]...`,
        );
      }
    }

    if (!isUniqueFound) {
      const emergencyTimeMarker = String(Date.now()).slice(-4);
      friendlyCode = `${friendlyCode}-${emergencyTimeMarker}`;
    }

    console.log(
      `🎫 [FreshPoint API] Generated tracking identifier: ${friendlyCode}`,
    );

    // Everything from here on runs AFTER Paystack captured the customer's
    // payment. Any order we cannot fulfil must be refunded and recorded, never
    // just rejected, or the customer is charged for nothing.
    const refundAndRecordOrder = async (
      merchantNote: string,
      customerMessage: string,
    ) => {
      const refundResult = await refundPaystackPayment(reference, merchantNote);

      const refundedOrder = await prisma.order
        .create({
          data: {
            id: reference,
            code: friendlyCode,
            userId: user.id,
            businessId: businessId,
            totalAmount: verifiedChargedAmountNaira,
            freshpointFee: 0,
            providerPayout: 0,
            freshpointNet: 0,
            status: OrderStatus.REFUNDED,
            refundStatus: refundResult.success ? "pending" : "failed",
            isDelivery: activeIsDelivery,
            deliveryAddress: activeAddress,
            deliveryNotes: activeNotes,
            deliveryFee: activeFee,
            deliveryLatitude: activeLatitude,
            deliveryLongitude: activeLongitude,
            customerPhone: activePhone,
            paystackRefundId: refundResult.refundId,
            items: {
              create: (items as CheckoutPayloadItem[]).map((item) => ({
                itemId: item.itemId,
                quantity: Number(item.quantity),
                // Best-effort record for support and audit only — the order
                // never fulfilled, so this is not used for billing.
                price: Number(item.price) || 0,
              })),
            },
          },
        })
        .catch((recordError: unknown) => {
          // The refund has already been requested. Failing to save the audit
          // record (e.g. an item id that does not exist) must not turn this
          // into a 500 for a customer who is being refunded.
          console.error(
            `🚨 [FreshPoint API] Refund requested for ${reference} but the REFUNDED order record could not be saved:`,
            recordError,
          );
          return null;
        });

      console.log(
        `💸 [FreshPoint API] Order ${reference} refunded. Refund success: ${refundResult.success}. Record saved: ${Boolean(refundedOrder)}`,
      );
      console.log("------------------------------------------------");

      return NextResponse.json(
        {
          success: false,
          error: customerMessage,
          orderId: refundedOrder?.id ?? null,
          orderCode: refundedOrder?.code ?? null,
          status: refundedOrder?.status ?? OrderStatus.REFUNDED,
        },
        { status: 409 },
      );
    };

    const platformRules = await getPlatformRules();
    if (platformRules.maintenanceModeActive) {
      return refundAndRecordOrder(
        "Platform is in maintenance mode.",
        `${MAINTENANCE_MESSAGE} ${REFUND_NOTICE}`,
      );
    }

    if (activeIsDelivery) {
      if (!activeAddress) {
        return refundAndRecordOrder(
          "Delivery order was submitted without a delivery address.",
          `Your order was missing a delivery address, so it could not be placed. ${REFUND_NOTICE}`,
        );
      }

      const resolved = await geocodeAddress(activeAddress).catch(() => null);
      if (!resolved) {
        return refundAndRecordOrder(
          `Could not resolve delivery address "${activeAddress}".`,
          `We couldn't locate your delivery address, so your order could not be placed. ${REFUND_NOTICE}`,
        );
      }
      activeLatitude = resolved.latitude;
      activeLongitude = resolved.longitude;

      const distanceKm = calculateHaversineDistance(
        { latitude: business.latitude, longitude: business.longitude },
        { latitude: resolved.latitude, longitude: resolved.longitude },
      );
      const radiusKm = getEffectiveDeliveryRadiusKm(
        business.subscriptionTier,
        business.deliveryRadiusKm,
        platformRules.maxDistanceLimitKm,
      );
      if (distanceKm > radiusKm) {
        return refundAndRecordOrder(
          `Delivery address is ${distanceKm.toFixed(1)}km away, outside the ${radiusKm}km delivery area.`,
          `That address is outside this business's delivery area, so your order could not be placed. ${REFUND_NOTICE}`,
        );
      }
      activeFee = Math.round(
        Math.max(
          Number(business.baseDeliveryFee) +
            Number(distanceKm.toFixed(2)) * Number(business.deliveryFeePerKm),
          platformRules.minGlobalDeliveryFee,
        ),
      );
    }

    // 4. Aggregate requested quantity per item (payload could theoretically
    // list the same itemId more than once — we need the TOTAL requested
    // against that item's stock, not just each line in isolation).
    const quantityByItem = new Map<string, number>();
    for (const line of items as CheckoutPayloadItem[]) {
      const qty = Number(line.quantity);
      if (!Number.isSafeInteger(qty) || qty <= 0) {
        return refundAndRecordOrder(
          "Order contained an invalid item quantity.",
          `Your order contained an invalid item quantity, so it could not be placed. ${REFUND_NOTICE}`,
        );
      }
      quantityByItem.set(
        line.itemId,
        (quantityByItem.get(line.itemId) || 0) + qty,
      );
    }

    console.log(
      "💾 [FreshPoint API] Committing atomic stock-check + order creation to Neon Postgres...",
    );

    try {
      // 5. ATOMIC CORE: check stock, resolve REAL prices from the DB, and
      // decrement stock — all in the SAME SERIALIZABLE transaction as order
      // creation. Prices are read here (not before the transaction) so a
      // retry re-reads fresh prices too, and so the price used to build
      // OrderItem rows is guaranteed consistent with the stock check.
      const order = await runSerializableWithRetry(async (tx) => {
        const resolvedItems: {
          itemId: string;
          quantity: number;
          price: number;
        }[] = [];
        let serverComputedSubtotal = 0;

        for (const [itemId, requestedQty] of quantityByItem) {
          const item = await tx.item.findUnique({
            where: { id: itemId },
            select: {
              price: true,
              salePrice: true,
              saleStartsAt: true,
              saleEndsAt: true,
              stock: true,
              type: true,
              name: true,
              businessId: true,
            },
          });

          if (!item) {
            throw new OrderRejectedError(
              `Item ${itemId} does not exist.`,
              `An item in your order is no longer available, so it could not be placed. ${REFUND_NOTICE}`,
            );
          }
          if (item.businessId !== businessId) {
            throw new OrderRejectedError(
              `Item ${itemId} belongs to a different business than ${businessId}.`,
              `An item in your order does not belong to this business, so it could not be placed. ${REFUND_NOTICE}`,
            );
          }

          // Services (bookings) aren't stock-tracked — only PRODUCT items are.
          if (item.type !== "SERVICE") {
            const available = item.stock ?? 0;
            if (requestedQty > available) {
              throw new InsufficientStockError(
                itemId,
                item.name,
                available,
                requestedQty,
              );
            }

            await tx.item.update({
              where: { id: itemId },
              data: { stock: { decrement: requestedQty } },
            });
          }

          const effectivePrice = getEffectiveItemPrice(item);
          resolvedItems.push({
            itemId,
            quantity: requestedQty,
            price: effectivePrice,
          });
          serverComputedSubtotal += effectivePrice * requestedQty;
        }

        const expectedTotal = serverComputedSubtotal + activeFee;

        if (
          Math.abs(expectedTotal - verifiedChargedAmountNaira) >
          PRICE_TOLERANCE_NAIRA
        ) {
          throw new PriceMismatchError(
            expectedTotal,
            verifiedChargedAmountNaira,
          );
        }

        const fees = calculateFees(
          expectedTotal,
          business.commissionRate ??
            getCommissionRateForTier(business.subscriptionTier),
        );

        return tx.order.create({
          data: {
            id: reference,
            code: friendlyCode,
            userId: user.id,
            businessId: businessId,
            totalAmount: expectedTotal,
            freshpointFee: fees.freshpointFee,
            providerPayout: fees.providerPayout,
            freshpointNet: fees.freshpointNet,
            status: OrderStatus.PENDING,
            isDelivery: activeIsDelivery,
            deliveryAddress: activeAddress,
            deliveryNotes: activeNotes,
            deliveryFee: activeFee,
            customerPhone: activePhone,
            items: {
              create: resolvedItems.map((ri) => ({
                itemId: ri.itemId,
                quantity: ri.quantity,
                price: ri.price,
              })),
            },
          },
        });
      });

      console.log(
        `🎉 [FreshPoint API] TRANSACTION RECORD LOCKED: Order ID ${order.id} | Code: ${order.code}`,
      );
      console.log("------------------------------------------------");

      // 🔔 Fire-and-forget business notification (email + web push). Never
      // awaited before the response, and errors are swallowed here so a
      // notification failure can never break the customer's checkout.
      notifyBusinessNewOrder({
        businessId,
        orderCode: order.code,
        orderId: order.id,
        customerName:
          `${user.firstName || "A customer"} ${user.lastName || ""}`.trim(),
        totalAmount: Number(order.totalAmount),
        isDelivery: activeIsDelivery,
      }).catch((err) => console.error("Order notify failed:", err));

      return NextResponse.json(
        {
          success: true,
          orderId: order.id,
          orderCode: order.code,
        },
        { status: 201 },
      );
    } catch (err: unknown) {
      if (err instanceof InsufficientStockError) {
        // The customer already paid via Paystack before this route ever ran,
        // so we can't "cancel" the charge — we refund it and record the order
        // as REFUNDED rather than silently losing the payment.
        console.warn(
          `⚠️ [FreshPoint API] Stock unavailable for "${err.itemName}" (wanted ${err.requested}, had ${err.available}). Initiating refund for ${reference}...`,
        );
        return refundAndRecordOrder(
          `Item "${err.itemName}" sold out before order could be fulfilled (requested ${err.requested}, had ${err.available}).`,
          `"${err.itemName}" just sold out. ${REFUND_NOTICE}`,
        );
      }

      if (err instanceof OrderRejectedError) {
        console.warn(
          `⚠️ [FreshPoint API] Order ${reference} rejected: ${err.reason} Initiating refund...`,
        );
        return refundAndRecordOrder(err.reason, err.customerMessage);
      }

      if (err instanceof PriceMismatchError) {
        // What Paystack actually confirms it charged doesn't match what this
        // order should legitimately cost, computed from real DB prices. Could
        // be a manipulated client payload, or a stale cart. Either way: don't
        // fulfil at an unverified price — refund and flag.
        console.error(
          `🚨 [FreshPoint API] PRICE MISMATCH for ${reference}: expected ₦${err.expectedTotal.toFixed(2)}, Paystack confirmed ₦${err.verifiedChargedAmount.toFixed(2)}. Refunding.`,
        );
        return refundAndRecordOrder(
          `Price verification mismatch: expected ₦${err.expectedTotal.toFixed(2)}, charged ₦${err.verifiedChargedAmount.toFixed(2)}.`,
          `We couldn't verify the amount charged for this order. ${REFUND_NOTICE}`,
        );
      }

      throw err; // genuine unexpected error — fall through to outer catch
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown server crash";
    console.error(
      `🚨 [FreshPoint API] CRITICAL UNHANDLED ERROR IN CONFIRMATION CONTROLLER: ${msg}`,
    );
    console.log("------------------------------------------------");
    return NextResponse.json(
      { error: `Internal transaction server error: ${msg}` },
      { status: 500 },
    );
  }
}
