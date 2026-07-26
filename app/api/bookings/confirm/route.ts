import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { BookingStatus } from "@prisma/client";
import { verifyPaystackPayment } from "@/lib/paystack";
import { isStaffOffDuty, generateUniqueQueueCode } from "./helpers";
import { queueBookingReminders } from "@/utils/reminders";
import { zonedWallTimeToUtc } from "@/lib/timezone";

interface PaystackWebhookData {
  status: string;
  reference: string;
  amount: number;
  metadata?: {
    userId?: string;
    itemId?: string;
    businessId?: string;
    date?: string;
    time?: string;
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
      date: bodyDate,
      time: bodyTime,
      staffId: bodyStaffId,
    } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 },
      );
    }

    // 1️⃣ Verify payment using the central gateway utility
    const isPaymentValid = await verifyPaystackPayment(reference);
    if (!isPaymentValid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const verifyData = await verifyResponse.json();

    const payment: PaystackWebhookData = verifyData.data;
    const metadata = payment.metadata;

    console.log("PAYSTACK METADATA RECEIVED:", metadata);

    const resolvedUserId = metadata?.userId;
    const resolvedItemId = metadata?.itemId || bodyItemId;
    const resolvedBusinessId = metadata?.businessId || bodyBusinessId;
    const resolvedDate = metadata?.date || bodyDate; // "YYYY-MM-DD"
    const resolvedTime = metadata?.time || bodyTime; // "HH:MM", business-local
    const resolvedStaffId = metadata?.staffId || bodyStaffId || null;

    if (
      !resolvedUserId ||
      !resolvedItemId ||
      !resolvedBusinessId ||
      !resolvedDate ||
      !resolvedTime
    ) {
      return NextResponse.json(
        {
          error: "Missing or incomplete payment metadata",
          debug: {
            resolvedUserId,
            resolvedItemId,
            resolvedBusinessId,
            resolvedDate,
            resolvedTime,
          },
        },
        { status: 400 },
      );
    }

    // 2️⃣ Fetch business (needed for timezone) and item (needed for real duration) together
    const business = await prisma.business.findUnique({
      where: { id: resolvedBusinessId },
      select: { timezone: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: resolvedItemId },
      select: { price: true, duration: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found for booking" },
        { status: 400 },
      );
    }

    // 3️⃣ Convert the business-local wall-clock date+time into the correct UTC instant
    const startTime = zonedWallTimeToUtc(
      resolvedDate,
      resolvedTime,
      business.timezone,
    );

    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid date or time parameter received",
          value: { resolvedDate, resolvedTime },
        },
        { status: 400 },
      );
    }

    const durationMinutes = item.duration || 30;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // 🛡️ STAFF OFF-DUTY HARD REJECTION
    if (resolvedStaffId && resolvedStaffId !== "any") {
      const scheduleStatus = await isStaffOffDuty(
        resolvedStaffId,
        resolvedDate,
      );
      if (scheduleStatus.isOff) {
        console.warn(
          `🚫 Staff ${resolvedStaffId} is off duty on ${scheduleStatus.dayName}. Booking rejected.`,
        );
        return NextResponse.json(
          {
            error: "Staff member is off duty on the selected day.",
            code: "STAFF_OFF_DUTY",
            day: scheduleStatus.dayName,
          },
          { status: 422 },
        );
      }
    }

    // 4️⃣ Resolve user from Clerk ID
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

    // 5️⃣ Prevent duplicate bookings
    const existingBooking = await prisma.booking.findUnique({
      where: { paymentReference: reference },
    });

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        bookingId: existingBooking.id,
      });
    }

    // 6️⃣ Calculate fee breakdown
    const servicePrice = payment.amount / 100;
    const fees = calculateFees(servicePrice);

    console.log("💰 Fee breakdown:", fees);

    // 7️⃣ Generate unique queue code
    const uniqueQueueCode = await generateUniqueQueueCode();

    // 8️⃣ Create booking with the correct real duration and real UTC start/end times
    const booking = await prisma.booking.create({
      data: {
        startTime,
        endTime,
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

    await queueBookingReminders(booking.id);

    return NextResponse.json({ success: true, bookingId: booking.id });
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
