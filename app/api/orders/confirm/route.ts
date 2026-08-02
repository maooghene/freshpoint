import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runSerializableWithRetry } from "@/lib/with-serializable-retry";
import { refundPaystackPayment } from "@/lib/paystack";
import {
  createSecureTrackCode,
  CheckoutRequestBody,
  CheckoutPayloadItem,
} from "./utils";
import { verifyPaystackPayment } from "./services";

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
      totalAmount,
      isDelivery,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryNotes,
      deliveryFee,
      customerPhone, // Added for emergency contact tracking
    } = body;

    console.log(
      `📊 [FreshPoint API] Incoming Checkout: Ref: ${reference} | Business: ${businessId} | Amount: ₦${totalAmount}`,
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

    // 1. Fire Outbound Remote Payment Gate Verification Checks
    const isPaymentValid = await verifyPaystackPayment(reference);
    if (!isPaymentValid) {
      return NextResponse.json(
        { error: "Payment verification failed or was declined by Paystack" },
        { status: 400 },
      );
    }

    console.log(
      "✅ [FreshPoint API] Paystack verification cleared cleanly. Resolving User record...",
    );

    // 2. Identify and validate the user context profile record
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      console.error(
        `❌ [FreshPoint API] Database reference mismatch: Clerk ID ${clerkId} lacks user profile.`,
      );
      return NextResponse.json(
        { error: "User identity profile not found" },
        { status: 404 },
      );
    }

    // Normalize incoming multi-tenant physical shipping structures
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
      // 5. ATOMIC CORE: check stock and decrement it, in the SAME
      // SERIALIZABLE transaction as order creation. If two concurrent
      // requests race for the same stock, Postgres detects the conflict
      // and one retries cleanly — same pattern as your booking fix.
      const order = await runSerializableWithRetry(async (tx) => {
        for (const [itemId, requestedQty] of quantityByItem) {
          const item = await tx.item.findUnique({
            where: { id: itemId },
            select: { stock: true, type: true, name: true },
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
          if (item.type === "SERVICE") continue;

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

        return tx.order.create({
          data: {
            id: reference,
            code: friendlyCode,
            userId: user.id,
            businessId: businessId,
            totalAmount: Number(totalAmount),
            status: OrderStatus.PENDING,
            isDelivery: activeIsDelivery,
            deliveryAddress: activeAddress,
            deliveryNotes: activeNotes,
            deliveryFee: activeFee,
            customerPhone: activePhone, // Saved directly to database
            items: {
              create: items.map((item: CheckoutPayloadItem) => ({
                itemId: item.itemId,
                quantity: Number(item.quantity),
                price: Number(item.price),
              })),
            },
          },
        });
      });

      console.log(
        `🎉 [FreshPoint API] TRANSACTION RECORD LOCKED: Order ID ${order.id} | Code: ${order.code}`,
      );
      console.log("------------------------------------------------");

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
            totalAmount: Number(totalAmount),
            status: OrderStatus.REFUNDED,
            refundStatus: refundResult.success ? "pending" : "failed",
            isDelivery: activeIsDelivery,
            deliveryAddress: activeAddress,
            deliveryNotes: activeNotes,
            deliveryFee: activeFee,
            deliveryLatitude: activeLatitude,
            deliveryLongitude: activeLongitude,
            customerPhone: activePhone, // Recorded for administrative tracking
            paystackRefundId: refundResult.refundId,

            items: {
              create: items.map((item: CheckoutPayloadItem) => ({
                itemId: item.itemId,
                quantity: Number(item.quantity),
                price: Number(item.price),
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
