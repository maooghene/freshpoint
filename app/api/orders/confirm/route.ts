import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { getCommissionRateForTier } from "@/lib/subscription-tiers";
import { runSerializableWithRetry } from "@/lib/with-serializable-retry";
import { refundPaystackPayment } from "@/lib/paystack";
import {
  createSecureTrackCode,
  CheckoutRequestBody,
  CheckoutPayloadItem,
} from "./utils";
import { getPaystackTransaction } from "./services";
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
function getEffectiveItemPrice(item: { price: number }): number {
  return item.price;
}

export async function POST(request: NextRequest) {
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

    const {
      reference,
      businessId,
      items,
      isDelivery,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryNotes,
      deliveryFee,
      customerPhone, // Added for emergency contact tracking
    } = body;
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
      select: { id: true, code: true, status: true },
    });

    if (existingOrder) {
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
      select: { commissionRate: true, subscriptionTier: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Normalize incoming multi-tenant physical shipping structures.
    // deliveryFee is STILL client-trusted here — that's a separate,
    // known gap (flagged, not fixed in this pass) from the item-price one
    // this change closes. It's carried through unchanged from before.
    const activeIsDelivery = Boolean(isDelivery);
    const activeAddress =
      activeIsDelivery && deliveryAddress
        ? String(deliveryAddress).trim()
        : null;
    const activeLatitude =
      activeIsDelivery && typeof deliveryLatitude === "number"
        ? deliveryLatitude
        : null;
    const activeLongitude =
      activeIsDelivery && typeof deliveryLongitude === "number"
        ? deliveryLongitude
        : null;
    const activeNotes =
      activeIsDelivery && deliveryNotes ? String(deliveryNotes).trim() : null;
    const activeFee =
      activeIsDelivery && deliveryFee ? Number(deliveryFee) : 0.0;
    const activePhone = customerPhone ? String(customerPhone).trim() : null;

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

    // 4. Aggregate requested quantity per item (payload could theoretically
    // list the same itemId more than once — we need the TOTAL requested
    // against that item's stock, not just each line in isolation).
    const quantityByItem = new Map<string, number>();
    for (const line of items as CheckoutPayloadItem[]) {
      const qty = Number(line.quantity);
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
            select: { price: true, stock: true, type: true, name: true },
          });

          if (!item) {
            throw new InsufficientStockError(
              itemId,
              "Unknown item",
              0,
              requestedQty,
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

        // deliveryFee is client-trusted (see comment above) — carried
        // through as-is until that's addressed separately.
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
        // so we can't "cancel" the charge — we have to refund it, and record
        // the order as REFUNDED rather than silently losing the payment.
        console.warn(
          `⚠️ [FreshPoint API] Stock unavailable for "${err.itemName}" (wanted ${err.requested}, had ${err.available}). Initiating refund for ${reference}...`,
        );

        const refundResult = await refundPaystackPayment(
          reference,
          `Item "${err.itemName}" sold out before order could be fulfilled (requested ${err.requested}, had ${err.available}).`,
        );

        const refundedOrder = await prisma.order.create({
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
                // Best-effort record only — the order never fulfilled, so
                // this is for support/audit visibility, not billing.
                price: Number(item.price) || 0,
              })),
            },
          },
        });

        console.log(
          `💸 [FreshPoint API] Order ${refundedOrder.id} recorded as REFUNDED. Refund success: ${refundResult.success}`,
        );
        console.log("------------------------------------------------");

        return NextResponse.json(
          {
            success: false,
            error: `"${err.itemName}" just sold out. Your payment is being refunded and should reach your account within 3–10 business days.`,
            orderId: refundedOrder.id,
            orderCode: refundedOrder.code,
            status: refundedOrder.status,
          },
          { status: 409 },
        );
      }

      if (err instanceof PriceMismatchError) {
        // What Paystack actually confirms it charged doesn't match what
        // this order should legitimately cost, computed from real DB
        // prices. Could be a manipulated client payload, or a stale cart
        // (item price changed between add-to-cart and checkout). Either
        // way: don't fulfill at an unverified price — refund and flag.
        console.error(
          `🚨 [FreshPoint API] PRICE MISMATCH for ${reference}: expected ₦${err.expectedTotal.toFixed(2)}, Paystack confirmed ₦${err.verifiedChargedAmount.toFixed(2)}. Refunding.`,
        );

        const refundResult = await refundPaystackPayment(
          reference,
          `Price verification mismatch: expected ₦${err.expectedTotal.toFixed(2)}, charged ₦${err.verifiedChargedAmount.toFixed(2)}.`,
        );

        const refundedOrder = await prisma.order.create({
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
                price: Number(item.price) || 0,
              })),
            },
          },
        });

        console.log(
          `💸 [FreshPoint API] Order ${refundedOrder.id} recorded as REFUNDED (price mismatch). Refund success: ${refundResult.success}`,
        );
        console.log("------------------------------------------------");

        return NextResponse.json(
          {
            success: false,
            error:
              "We couldn't verify the amount charged for this order. Your payment is being refunded and should reach your account within 3–10 business days.",
            orderId: refundedOrder.id,
            orderCode: refundedOrder.code,
            status: refundedOrder.status,
          },
          { status: 409 },
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
