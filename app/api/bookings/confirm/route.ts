// app/api/bookings/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateFees } from "@/lib/fees";
import { BookingStatus } from "@prisma/client";
import { getPaystackTransaction, refundPaystackPayment } from "@/lib/paystack";
import { isStaffOffDuty, generateUniqueQueueCode } from "./helpers";
import { queueBookingReminders } from "@/utils/reminders";
import { getCommissionRateForTier } from "@/lib/subscription-tiers";
import { zonedWallTimeToUtc } from "@/lib/timezone";
import {
  isWithinBusinessHours,
  isWithinBookingWindow,
} from "@/lib/booking-rules";
import { validateServingCapacity } from "@/lib/booking-validator";
import { runSerializableWithRetry } from "@/lib/with-serializable-retry";
import { notifyBusinessNewBooking } from "@/lib/notify-business";

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

    // 🚀 FIXED: This used to call verifyPaystackPayment() (boolean only) and
    // then make a SECOND, hand-rolled fetch to re-fetch the transaction data
    // — and that second fetch had a broken template literal
    // (`https://paystack.co{encodeURIComponent(reference)}`, missing the `$`
    // and the correct API path), which threw on every request and caused
    // every booking confirmation to fail with a 500 in production, even
    // though the customer's payment had already gone through successfully.
    // One correct call now does both the verification and the data fetch.
    const payment = (await getPaystackTransaction(
      reference,
    )) as PaystackWebhookData | null;

    if (!payment) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

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

    // Single fetch — includes schedules for hours-check AND the fields we
    // need for commission calculation (commissionRate, subscriptionTier).
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
        // Payment is already captured at this point. A customer picking a
        // specific off-duty staff member is a real rejection, not a data
        // error — refund immediately rather than leaving a captured charge
        // with no booking behind it.
        const refund = await refundPaystackPayment(
          reference,
          `Auto-refund: staff off duty (${scheduleStatus.dayName})`,
        );
        if (!refund.success) {
          console.error(
            "❌ CRITICAL: Refund failed after STAFF_OFF_DUTY rejection. Reference:",
            reference,
          );
        }
        return NextResponse.json(
          {
            error: "Staff member is off duty on the selected day.",
            code: "STAFF_OFF_DUTY",
            day: scheduleStatus.dayName,
            refunded: refund.success,
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
    const commissionRate =
      business.commissionRate ??
      getCommissionRateForTier(business.subscriptionTier);
    const fees = calculateFees(servicePrice, commissionRate);
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
            status: BookingStatus.PENDING,
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

      // 🔔 Fire-and-forget business notification (email + web push). Never
      // awaited before the response, errors swallowed so a notification
      // failure can never break the customer's booking confirmation.
      notifyBusinessNewBooking({
        businessId: resolvedBusinessId,
        queueCode: booking.queueCode ?? uniqueQueueCode,
        bookingId: booking.id,
        customerName:
          `${user.firstName || "A customer"} ${user.lastName || ""}`.trim(),
        totalAmount: servicePrice,
        startTime: booking.startTime,
      }).catch((err: unknown) => console.error("Booking notify failed:", err));

      return NextResponse.json({ success: true, bookingId: booking.id });
    } catch (err) {
      if (err instanceof BookingRejected) {
        // Payment was already captured by Paystack before this validation
        // ran inside the transaction. A rejection here — fully booked, no
        // staff available, data drift, etc. — means we're holding money for
        // a booking that will never exist. Refund immediately rather than
        // relying on a webhook or manual reconciliation to catch it later.
        const refund = await refundPaystackPayment(
          reference,
          `Auto-refund: booking rejected — ${err.message}`,
        );
        if (!refund.success) {
          // Refund itself failing is the critical case — this is now an
          // orphaned charge with no booking and no automatic reversal.
          // Log loudly so it surfaces in monitoring/alerts.
          console.error(
            "❌ CRITICAL: Refund failed after booking rejection. Reference:",
            reference,
            "Reason:",
            err.message,
          );
        }
        return NextResponse.json(
          { error: err.message, refunded: refund.success },
          { status: 409 },
        );
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
