import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSecureTrackCode,
  CheckoutRequestBody,
  CheckoutPayloadItem,
} from "./utils";
import { verifyPaystackPayment } from "./services";

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
      deliveryNotes,
      deliveryFee,
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
    const activeNotes =
      activeIsDelivery && deliveryNotes ? String(deliveryNotes).trim() : null;
    const activeFee =
      activeIsDelivery && deliveryFee ? Number(deliveryFee) : 0.0;

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
    console.log(
      "💾 [FreshPoint API] Committing record atomic upsert operation to Neon Postgres...",
    );

    // Safe transaction cleaner to avoid duplication key constraint drops on retry loops
    await prisma.orderItem.deleteMany({
      where: { orderId: reference },
    });

    // 4. Commit atomic records using Upsert to safely handle concurrent retries cleanly
    const order = await prisma.order.upsert({
      where: { id: reference },
      update: {
        status: OrderStatus.PENDING,
        totalAmount: Number(totalAmount),
        isDelivery: activeIsDelivery,
        deliveryAddress: activeAddress,
        deliveryNotes: activeNotes,
        deliveryFee: activeFee,
        items: {
          create: items.map((item: CheckoutPayloadItem) => ({
            itemId: item.itemId,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
      create: {
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
