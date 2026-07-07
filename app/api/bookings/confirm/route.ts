import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { BookingStatus, DayOfWeek } from "@prisma/client";
import { getDayNameFromDateString } from "@/lib/dateUtils";

interface PaystackWebhookData {
  status: string;
  reference: string;
  amount: number;
  metadata?: {
    userId?: string;
    itemId?: string;
    businessId?: string;
    dateTime?: string;
    staffId?: string;
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
      staffId: bodyStaffId,
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
      bodyStaffId,
    });

    // Resolve all fields — Paystack metadata takes priority, body is fallback
    const resolvedUserId = metadata?.userId;
    const resolvedItemId = metadata?.itemId || bodyItemId;
    const resolvedBusinessId = metadata?.businessId || bodyBusinessId;
    const resolvedDateTime = metadata?.dateTime || bodyStartTime;
    const resolvedStaffId = metadata?.staffId || bodyStaffId || null;

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

    // 🛡️ STAFF OFF-DUTY HARD REJECTION
    if (resolvedStaffId && resolvedStaffId !== "any") {
      const dateOnly = resolvedDateTime.split("T")[0];
      const targetDayName = getDayNameFromDateString(dateOnly);

      const staffSchedule = await prisma.staffSchedule.findUnique({
        where: {
          staffId_day: {
            staffId: resolvedStaffId,
            day: targetDayName as DayOfWeek,
          },
        },
      });

      if (staffSchedule && staffSchedule.isOff) {
        console.warn(
          `🚫 Staff ${resolvedStaffId} is off duty on ${targetDayName}. Booking rejected.`,
        );
        return NextResponse.json(
          {
            error: "Staff member is off duty on the selected day.",
            code: "STAFF_OFF_DUTY",
            day: targetDayName,
          },
          { status: 422 },
        );
      }
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

    // 7️⃣ Generate unique queue code
    let uniqueQueueCode = "";
    let isCodeUnique = false;

    while (!isCodeUnique) {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const randomLetter = characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
      const randomNumber = Math.floor(10 + Math.random() * 90);
      uniqueQueueCode = `FP-${randomLetter}${randomNumber}`;

      const collisionCheck = await prisma.booking.findFirst({
        where: { queueCode: uniqueQueueCode },
        select: { id: true },
      });

      if (!collisionCheck) {
        isCodeUnique = true;
      }
    }

    // 8️⃣ Create booking with BookingItem join and fee breakdown
    const booking = await prisma.booking.create({
      data: {
        startTime,
        endTime: new Date(startTime.getTime() + 60 * 60000),
        status: BookingStatus.CONFIRMED,
        locationType: "IN_SHOP",
        businessId: resolvedBusinessId,
        userId: user.id,
        paymentReference: reference,
        paymentStatus: "paid",
        totalAmount: servicePrice,
        queueCode: uniqueQueueCode,
        freshpointFee: fees.freshpointFee,
        providerPayout: fees.providerPayout,
        freshpointNet: fees.freshpointNet,
        ...(resolvedStaffId && resolvedStaffId !== "any"
          ? { staffId: resolvedStaffId }
          : {}),
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
