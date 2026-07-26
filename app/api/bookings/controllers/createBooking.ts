// app/api/bookings/controllers/createBooking.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookingStatus } from "@prisma/client";
import { validateServingCapacity } from "@/lib/booking-validator";
import { queueBookingReminders } from "@/utils/reminders";
import { zonedWallTimeToUtc } from "@/lib/timezone";

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
        { error: "Missing required booking metrics parameters" },
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

// Need the business's timezone to correctly interpret the requested wall-clock time
const business = await prisma.business.findUnique({
  where: { id: businessId },
});
if (!business) {
  return NextResponse.json({ error: "Business not found" }, { status: 404 });
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

    const check = await validateServingCapacity({
      businessId,
      staffId: staffId || "any",
      dateString: date,
      startTime: appointmentStart,
      durationMinutes,
    });

    if (!check.isValid) {
      return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    const userRecord = await prisma.user.findUnique({ where: { clerkId } });
    if (!userRecord) {
      return NextResponse.json(
        { error: "Identity profile missing from cluster" },
        { status: 400 },
      );
    }

    const appointmentEnd = new Date(
      appointmentStart.getTime() + durationMinutes * 60 * 1000,
    );
    const generatedPassCode = `FP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const calculatedCommissionFee = serviceItem.price * 0.08;
    const computedProviderPayout = serviceItem.price - calculatedCommissionFee;

    const newBooking = await prisma.booking.create({
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

    // Queue reminder emails + trigger calendar sync for the new booking
    await queueBookingReminders(newBooking.id);

    return NextResponse.json(
      { success: true, booking: newBooking },
      { status: 201 },
    );
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
