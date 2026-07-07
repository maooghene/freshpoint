import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Standardized pluralized named export connection pooler
import { auth } from "@clerk/nextjs/server";
import { BookingStatus } from "@prisma/client";
import { validateServingCapacity } from "@/lib/booking-validator"; // Clean isolated utility import

interface CreateBookingPayload {
  itemId: string;
  businessId: string;
  date: string; // e.g., "2026-07-01"
  time: string; // e.g., "08:30 AM"
  staffId?: string; // "any" or a specific staff ID string
}

/* =========================================================================
   GET: Retrieve Authenticated Client Order Transaction History
   ========================================================================= */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Identity profile missing" },
        { status: 400 },
      );
    }

    // CALCULATE RETENTION BOUNDARY (Exactly 12 months ago from today to match pruning parameters)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const rawBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { name: true, address: true } },
        items: {
          include: {
            item: { select: { name: true, image: true, type: true } },
          },
        },
        ratings: { select: { rating: true } },
      },
    });

    const formattedBookings = rawBookings.map((b) => ({
      id: b.id,
      status: b.status,
      startTime: b.startTime.toISOString(),
      createdAt: b.createdAt.toISOString(),
      totalAmount: b.totalAmount || 0,
      queueCode: b.queueCode || "FP-TBD",
      isVerifiedByStaff: b.isVerifiedByStaff || false,
      business: {
        id: b.businessId,
        name: b.business.name,
        address: b.business.address,
      },
      items: b.items.map((i) => ({
        id: i.id,
        price: i.price,
        item: {
          name: i.item?.name || "Premium Wellness Asset",
          image: i.item?.image || null,
          type: i.item?.type || "SERVICE",
        },
      })),
      ratings: b.ratings,
    }));

    return NextResponse.json(formattedBookings, { status: 200 });
  } catch (error) {
    console.error("Booking history core collection extraction failure:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/* =========================================================================
   POST: Create a Safe, Overlap-Validated Booking Slot Interceptor Pipeline
   ========================================================================= */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateBookingPayload;
    const { itemId, businessId, date, time, staffId } = body;

    if (!itemId || !businessId || !date || !time) {
      return NextResponse.json(
        { error: "Missing required booking metrics parameters" },
        { status: 400 },
      );
    }

    // Resolve service offering timeline attributes
    const serviceItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!serviceItem) {
      return NextResponse.json(
        { error: "Selected service offering not found" },
        { status: 404 },
      );
    }

    // 💡 CRITICAL VISIBILITY FIREWALL: Instantly drop the request if this item was toggled off!
    if (!serviceItem.isActive) {
      return NextResponse.json(
        {
          error:
            "This item or treatment has been temporarily deactivated by the provider. Please select an active service.",
        },
        { status: 422 }, // Unprocessable Entity
      );
    }

    // Standardize timeline strings into a unified JavaScript Date payload object
    const appointmentStart = new Date(`${date} ${decodeURIComponent(time)}`);
    const durationMinutes = serviceItem.duration || 30;

    // Passes the raw, unshifted date string to prevent timezone day-shifting errors
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

    // Resolve client profile details
    const userRecord = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: "Identity profile missing" },
        { status: 400 },
      );
    }

    const appointmentEnd = new Date(
      appointmentStart.getTime() + durationMinutes * 60 * 1000,
    );
    const generatedPassCode = `FP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Instantiate record inside a single database transaction allocation
    const newBooking = await prisma.booking.create({
      data: {
        businessId,
        userId: userRecord.id,
        staffId: check.assignedStaffId,
        startTime: appointmentStart,
        endTime: appointmentEnd,
        totalAmount: serviceItem.price,
        status: BookingStatus.CONFIRMED, // Enforces standard Prisma schema enum constraints
        queueCode: generatedPassCode,
        items: {
          create: {
            itemId: serviceItem.id,
            price: serviceItem.price,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, booking: newBooking },
      { status: 201 },
    );
  } catch (error) {
    console.error("Booking registration reservation pipeline failure:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
