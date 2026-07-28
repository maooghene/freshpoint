// app/api/bookings/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { BookingStatus } from "@prisma/client";
import { verifyPaystackPayment } from "@/lib/paystack";
import { isStaffOffDuty, generateUniqueQueueCode } from "./helpers";
import { queueBookingReminders } from "@/utils/reminders";
import { zonedWallTimeToUtc } from "@/lib/timezone";
import {
  isWithinBusinessHours,
  isWithinBookingWindow,
} from "@/lib/booking-rules";
import { validateServingCapacity } from "@/lib/booking-validator";
import { runSerializableWithRetry } from "@/lib/with-serializable-retry";

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

class BookingRejected extends Error {}

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
      customerPhone, // Extracted from client fetch body
    } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 },
      );
    }

    const isPaymentValid = await verifyPaystackPayment(reference);
    if (!isPaymentValid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const verifyResponse = await fetch(
      `https://paystack.co{encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const verifyData = await verifyResponse.json();

    const payment: PaystackWebhookData = verifyData.data;
    const metadata = payment.metadata;

    const resolvedUserId = metadata?.userId;
    const resolvedItemId = metadata?.itemId || bodyItemId;
    const resolvedBusinessId = metadata?.businessId || bodyBusinessId;
    const resolvedDate = metadata?.date || bodyDate;
    const resolvedTime = metadata?.time || bodyTime;
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

    const business = await prisma.business.findUnique({
      where: { id: resolvedBusinessId },
      include: { schedules: true },
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

    const hoursCheck = isWithinBusinessHours(
      resolvedDate,
      startTime,
      endTime,
      business.schedules,
      business.timezone,
    );
    if (!hoursCheck.isOpen) {
      return NextResponse.json({ error: hoursCheck.reason }, { status: 409 });
    }

    const windowCheck = isWithinBookingWindow(
      startTime,
      business.minNoticeHours,
      business.maxAheadDays,
    );
    if (!windowCheck.isValid) {
      return NextResponse.json({ error: windowCheck.reason }, { status: 409 });
    }

    if (resolvedStaffId && resolvedStaffId !== "any") {
      const scheduleStatus = await isStaffOffDuty(
        resolvedStaffId,
        resolvedDate,
      );
      if (scheduleStatus.isOff) {
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

    const activePhone = customerPhone ? String(customerPhone).trim() : null;

    const existingBooking = await prisma.booking.findUnique({
      where: { paymentReference: reference },
    });
    if (existingBooking) {
      return NextResponse.json({
        success: true,
        bookingId: existingBooking.id,
      });
    }

    const servicePrice = payment.amount / 100;
    const fees = calculateFees(servicePrice);
    const uniqueQueueCode = await generateUniqueQueueCode();

    try {
      const booking = await runSerializableWithRetry(async (tx) => {
        const check = await validateServingCapacity({
          db: tx,
          businessId: resolvedBusinessId,
          staffId: resolvedStaffId || "any",
          dateString: resolvedDate,
          startTime,
          durationMinutes,
        });

        if (!check.isValid) {
          throw new BookingRejected(
            check.reason || "This time slot is unavailable.",
          );
        }

        return tx.booking.create({
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
            staffId: check.assignedStaffId ?? undefined,
            customerPhone: activePhone, // Snapshotted directly into service record rows
            items: {
              create: [{ itemId: resolvedItemId, price: servicePrice }],
            },
          },
        });
      });

      await queueBookingReminders(booking.id);

      return NextResponse.json({ success: true, bookingId: booking.id });
    } catch (err) {
      if (err instanceof BookingRejected) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }
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
