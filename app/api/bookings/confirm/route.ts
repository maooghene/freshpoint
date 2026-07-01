import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { BookingStatus } from "@prisma/client";

interface PaystackWebhookData {
  status: string;
  reference: string;
  amount: number;
  metadata?: {
    userId?: string;
    itemId?: string;
    businessId?: string;
    dateTime?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reference,
      businessId: bodyBusinessId,
      itemId: bodyItemId,
      startTime: bodyStartTime,
    } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 },
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // 1️⃣ Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      },
    );

    const verifyData = await verifyResponse.json();

    if (
      !verifyResponse.ok ||
      !verifyData?.data ||
      verifyData.data.status !== "success"
    ) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const payment: PaystackWebhookData = verifyData.data;
    const metadata = payment.metadata;

    console.log("PAYSTACK METADATA RECEIVED:", metadata);
    console.log("REQUEST BODY RECEIVED:", {
      bodyBusinessId,
      bodyItemId,
      bodyStartTime,
    });

    // Use Paystack metadata where available, fallback to request body
    const resolvedUserId = metadata?.userId;
    const resolvedItemId = metadata?.itemId || bodyItemId;
    const resolvedBusinessId = metadata?.businessId || bodyBusinessId;
    const resolvedDateTime = metadata?.dateTime || bodyStartTime;

    if (
      !resolvedUserId ||
      !resolvedItemId ||
      !resolvedBusinessId ||
      !resolvedDateTime
    ) {
      return NextResponse.json(
        {
          error: "Missing or incomplete payment metadata",
          debug: {
            resolvedUserId,
            resolvedItemId,
            resolvedBusinessId,
            resolvedDateTime,
          },
        },
        { status: 400 },
      );
    }

    // 2️⃣ Resolve user from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: resolvedUserId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User identity profile not found in database logs",
          clerkId: resolvedUserId,
        },
        { status: 400 },
      );
    }

    // 3️⃣ Prevent duplicate bookings
    const existingBooking = await prisma.booking.findUnique({
      where: { paymentReference: reference },
    });

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        bookingId: existingBooking.id,
      });
    }

    // 4️⃣ Validate datetime
    const startTime = new Date(resolvedDateTime);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid dateTime parameter received",
          value: resolvedDateTime,
        },
        { status: 400 },
      );
    }

    // 5️⃣ Fetch item price
    const item = await prisma.item.findUnique({
      where: { id: resolvedItemId },
      select: { price: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found for booking" },
        { status: 400 },
      );
    }

    // 6️⃣ Calculate fee breakdown
    const servicePrice = payment.amount / 100;
    const fees = calculateFees(servicePrice);

    console.log("💰 Fee breakdown:", fees);

    // 1️⃣ Generate a Truly Unique Temporal Sequence Code (e.g., FP-19284)
    // - Takes the current timestamp in milliseconds
    // - Slices the last 5 digits (changes every millisecond)
    // - Appends a 2-digit random buffer to handle concurrent parallel queries perfectly
    let uniqueQueueCode = "";
    let isCodeUnique = false;

    // 🌟 THE MANUAL BACKUP LOOP: Generates memorable passes like FP-A56, FP-B91, etc.
    while (!isCodeUnique) {
      // 1. Pick a random uppercase letter from A to Z
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const randomLetter = characters.charAt(
        Math.floor(Math.random() * characters.length),
      );

      // 2. Pick a random 2-digit number sequence buffer
      const randomNumber = Math.floor(10 + Math.random() * 90);

      // 3. Combine into your exact requested string format pattern
      uniqueQueueCode = `FP-${randomLetter}${randomNumber}`;

      // 4. Quick database query check to confirm no duplication collisions exist
      const collisionCheck = await prisma.booking.findFirst({
        where: { queueCode: uniqueQueueCode },
        select: { id: true },
      });

      if (!collisionCheck) {
        isCodeUnique = true; // Code is clear to save, break the generation loop!
      }
    }



    // 7️⃣ Create booking with BookingItem join and dynamic fee calculation outputs
    const booking = await prisma.booking.create({
      data: {
        startTime,
        endTime: new Date(startTime.getTime() + 60 * 60000),
        status: BookingStatus.CONFIRMED,
        locationType: "IN_SHOP",
        businessId: resolvedBusinessId,
        userId: user.id, // Dynamically maps database UUID/CUID from verified Clerk lookup
        paymentReference: reference, // Dynamic Paystack gateway tracking parameter token
        paymentStatus: "paid",
        totalAmount: servicePrice,

        queueCode: uniqueQueueCode,

        freshpointFee: fees.freshpointFee,
        providerPayout: fees.providerPayout,
        freshpointNet: fees.freshpointNet,

        items: {
          create: [
            {
              itemId: resolvedItemId,
              price: servicePrice,
            },
          ],
        },
      },
    });

    console.log("✅ Booking created successfully:", booking.id);
    console.log(`   Service price:   ₦${fees.servicePrice.toLocaleString()}`);
    console.log(`   FreshPoint fee:  ₦${fees.freshpointFee.toLocaleString()}`);
    console.log(`   Provider payout: ₦${fees.providerPayout.toLocaleString()}`);
    console.log(`   FreshPoint net:  ₦${fees.freshpointNet.toLocaleString()}`);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    });
  } catch (error: unknown) {
    console.error("❌ Booking confirmation handler exception:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to confirm booking", message: errorMessage },
      { status: 500 },
    );
  }
}
