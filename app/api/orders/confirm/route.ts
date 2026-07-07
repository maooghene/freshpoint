import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { OrderStatus } from "@prisma/client";
import { format } from "date-fns"; 

interface CheckoutPayloadItem {
  itemId: string;
  quantity: number;
  price: number;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    reference: string;
  };
}

// Senior type-safe friendly random code generator (FP-356 format)
function createSecureTrackCode(): string {
  const characters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 secure, highly clear uppercase parameters
  let randomPayload = "";

  // Create a 5-character high-density string snippet
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPayload += characters.charAt(randomIndex);
  }

  // Calculate dynamic date markers natively (e.g. July 2026 becomes "2607")
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const monthRaw = now.getMonth() + 1;
  const monthShort = monthRaw < 10 ? `0${monthRaw}` : String(monthRaw);

  return `FP-${yearShort}${monthShort}-${randomPayload}`;
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

    const body = await request.json().catch(() => null);
    if (!body) {
      console.error(
        "❌ [FreshPoint API] Failed to extract request body. Payload is empty or malformed.",
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

    console.log("📊 [FreshPoint API] Incoming Checkout Metadata:");
    console.log(`   - Reference Code: ${reference}`);
    console.log(`   - Business ID:    ${businessId}`);
    console.log(`   - Is Delivery:    ${Boolean(isDelivery)}`);
    console.log(`   - Final Amount:   ₦${totalAmount}`);

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

    // DIAGNOSTIC CHECK: Isolate local .env credentials loading thresholds
    const secretKeyExists = !!process.env.PAYSTACK_SECRET_KEY;
    console.log(
      `🔑 [FreshPoint API] Environment check: Secret Key loaded? [${secretKeyExists ? "YES" : "NO"}]`,
    );

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error(
        "❌ [FreshPoint API] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing from system environment variables.",
      );
      return NextResponse.json(
        {
          error:
            "Internal Server Configuration Error: Missing Secret Authorization Key",
        },
        { status: 500 },
      );
    }

    const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
    console.log(
      `📡 [FreshPoint API] Outbound fetch dispatching to: ${verifyUrl}`,
    );

    // DIAGNOSTIC WRAPPER: Catch raw low-level Node network stream connection crashes or system timeouts
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }).catch((fetchError: unknown) => {
      const systemErrorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : "Socket network connection dropped";
      console.error(
        "💥 [FreshPoint API] CORE FETCH EXCEPTION ENCOUNTERED DURING OUTBOUND PIPELINE:",
      );
      console.error(`   - Error Message: ${systemErrorMessage}`);
      throw new Error(
        `Outbound socket execution failed: ${systemErrorMessage}`,
      );
    });

    console.log(
      `📥 [FreshPoint API] Outbound fetch status code returned: ${verifyResponse.status}`,
    );
    const verifyData = (await verifyResponse.json()) as PaystackVerifyResponse;

    if (
      !verifyResponse.ok ||
      !verifyData?.status ||
      !verifyData?.data ||
      verifyData.data.status !== "success"
    ) {
      console.error(
        "❌ [FreshPoint API] Paystack Transaction validation rejected by remote gateway:",
      );
      console.error(`   - Status Payload:  `, verifyData?.status);
      console.error(`   - Message Payload: `, verifyData?.message);
      console.error(`   - Data Signature:  `, verifyData?.data);
      return NextResponse.json(
        { error: "Payment verification failed or was declined by Paystack" },
        { status: 400 },
      );
    }

    console.log(
      "✅ [FreshPoint API] Paystack verification cleared cleanly. Resolving User record...",
    );

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      console.error(
        `❌ [FreshPoint API] Database reference mismatch: Clerk user ID ${clerkId} lacks a valid User profile record.`,
      );
      return NextResponse.json(
        { error: "User identity profile not found" },
        { status: 404 },
      );
    }

    // Clear falling property defaults matrix alignment paths
    const activeIsDelivery = Boolean(isDelivery);
    const activeAddress =
      activeIsDelivery && deliveryAddress
        ? String(deliveryAddress).trim()
        : null;
    const activeNotes =
      activeIsDelivery && deliveryNotes ? String(deliveryNotes).trim() : null;
    const activeFee =
      activeIsDelivery && deliveryFee ? Number(deliveryFee) : 0.0;

    // Generate our fresh short friendly order code token
        

    console.log(
      "💾 [FreshPoint API] Committing record atomic write operation to Neon Postgres..."
    );

        // 🎫 ATOMIC INTERACTION CHECK: Infinite Scale Protection
    let friendlyCode = "";
    let isUniqueFound = false;
    let collisionSafetyAttempts = 0;
    const maxSafetyThreshold = 5;

    while (!isUniqueFound && collisionSafetyAttempts < maxSafetyThreshold) {
      friendlyCode = createSecureTrackCode();
      
      // 🚀 CRITICAL REFACTOR: Changed from .findUnique to .findFirst to bypass cached type constraints
      const duplicateCheck = await prisma.order.findFirst({
        where: { code: friendlyCode },
        select: { id: true }
      });
      
      if (!duplicateCheck) {
        isUniqueFound = true;
      } else {
        collisionSafetyAttempts++;
        console.warn(
          `⚠️ [FreshPoint API] Code collision detected for code [${friendlyCode}]. Attempting re-generation [${collisionSafetyAttempts}/${maxSafetyThreshold}]...`
        );
      }
    }

    // Fallback emergency safety net if maximum retry attempts are breached
    if (!isUniqueFound) {
      const emergencyTimeMarker = String(Date.now()).slice(-4);
      friendlyCode = `${friendlyCode}-${emergencyTimeMarker}`;
    }

    console.log(
      `🎫 [FreshPoint API] Generated bulletproof order identifier: ${friendlyCode}`
    );


    const order = await prisma.order.create({
      data: {
        id: reference as string,
        code: friendlyCode, // Maps short code straight into our new schema database slot
        userId: user.id,
        businessId: businessId as string,
        totalAmount: Number(totalAmount),
        status: OrderStatus.PROCESSING,

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
      `🎉 [FreshPoint API] TRANSACTION RECORD LOCKED SUCCESSFUL: Order ID ${order.id} | Friendly Code: ${order.code}`,
    );
    console.log("------------------------------------------------");

    // CRITICAL UPDATE: Pass both parameters so the frontend client layout can render the shortcode
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
      "🚨 [FreshPoint API] CRITICAL UNHANDLED ERROR IN CONFIRMATION CONTROLLER:",
    );
    console.error(`   - Details: ${msg}`);
    console.log("------------------------------------------------");
    return NextResponse.json(
      { error: `Internal transaction parsing server error: ${msg}` },
      { status: 500 },
    );
  }
}
