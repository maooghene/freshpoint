import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookingStatus } from "@prisma/client";
import { validateServingCapacity } from "@/lib/booking-validator";
import { zonedWallTimeToUtc } from "@/lib/timezone";
import {
  isWithinBusinessHours,
  isWithinBookingWindow,
} from "@/lib/booking-rules";
import { runSerializableWithRetry } from "@/lib/with-serializable-retry";
import { queueBookingReminders } from "@/utils/reminders";

interface CreateBookingPayload {
  itemId: string;
  businessId: string;
  date: string;
  time: string;
  staffId?: string;
}

export async function handleCreateNewBooking(
  req: NextRequest,
): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload body structure" },
        { status: 400 },
      );
    }

    const payload = body as CreateBookingPayload;
    const { itemId, businessId, date, time, staffId } = payload;

    if (!itemId || !businessId || !date || !time) {
      return NextResponse.json(
        { error: "Missing required booking parameters" },
        { status: 400 },
      );
    }

    const serviceItem = await prisma.item.findUnique({ where: { id: itemId } });
    if (!serviceItem) {
      return NextResponse.json(
        { error: "Selected service offering not found" },
        { status: 404 },
      );
    }

    if (!serviceItem.isActive) {
      return NextResponse.json(
        {
          error:
            "This item or treatment has been temporarily deactivated by the provider.",
        },
        { status: 422 },
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { schedules: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const cleanTimeStr = decodeURIComponent(time).trim();
    const appointmentStart = zonedWallTimeToUtc(
      date,
      cleanTimeStr,
      business.timezone,
    );

    if (isNaN(appointmentStart.getTime())) {
      return NextResponse.json(
        { error: "Invalid date or time format" },
        { status: 400 },
      );
    }

    const durationMinutes = serviceItem.duration || 30;
    const appointmentEnd = new Date(
      appointmentStart.getTime() + durationMinutes * 60 * 1000,
    );

    // Check business hours before anything else — cheapest check, no DB writes involved.
    const hoursCheck = isWithinBusinessHours(
      date,
      appointmentStart,
      appointmentEnd,
      business.schedules,
      business.timezone,
    );
    if (!hoursCheck.isOpen) {
      return NextResponse.json({ error: hoursCheck.reason }, { status: 409 });
    }

    // Check min-notice / max-ahead window
    const windowCheck = isWithinBookingWindow(
      appointmentStart,
      business.minNoticeHours,
      business.maxAheadDays,
    );
    if (!windowCheck.isValid) {
      return NextResponse.json({ error: windowCheck.reason }, { status: 409 });
    }

    const userRecord = await prisma.user.findUnique({ where: { clerkId } });
    if (!userRecord) {
      return NextResponse.json(
        { error: "Identity profile missing from cluster" },
        { status: 400 },
      );
    }

    const generatedPassCode = `FP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const calculatedCommissionFee = serviceItem.price * 0.08;
    const computedProviderPayout = serviceItem.price - calculatedCommissionFee;

    // Capacity check + booking creation happen atomically at SERIALIZABLE isolation —
    // Postgres itself guarantees two concurrent requests can't both succeed for the
    // same slot, retrying automatically on the rare detected conflict.
    try {
      const newBooking = await runSerializableWithRetry(async (tx) => {
        const check = await validateServingCapacity({
          db: tx,
          businessId,
          staffId: staffId || "any",
          dateString: date,
          startTime: appointmentStart,
          durationMinutes,
        });

        if (!check.isValid) {
          throw new BookingRejected(
            check.reason || "This time slot is unavailable.",
          );
        }

        return tx.booking.create({
          data: {
            businessId,
            userId: userRecord.id,
            staffId: check.assignedStaffId,
            startTime: appointmentStart,
            endTime: appointmentEnd,
            totalAmount: serviceItem.price,
            freshpointFee: calculatedCommissionFee,
            providerPayout: computedProviderPayout,
            status: BookingStatus.CONFIRMED,
            queueCode: generatedPassCode,
            items: {
              create: {
                itemId: serviceItem.id,
                price: serviceItem.price,
              },
            },
          },
        });
      });

      await queueBookingReminders(newBooking.id);

      return NextResponse.json(
        { success: true, booking: newBooking },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof BookingRejected) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }
  } catch (error: unknown) {
    const errorTrace =
      error instanceof Error
        ? error.message
        : "Fatal registration pipeline trace";
    console.error("Booking reservation failure:", errorTrace);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// A typed "expected rejection" — lets us throw inside the transaction to abort it
// cleanly (Prisma rolls back automatically on any thrown error) while still
// distinguishing "business rule failed" from "something actually broke."
class BookingRejected extends Error {}
