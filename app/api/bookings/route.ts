import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookingStatus } from "@prisma/client";

/* ================= TYPES FOR CREATE BOOKING (POST) ================= */

interface CreateBookingPayload {
  itemId: string;
  businessId: string;
  date: string; // e.g., "2026-07-01"
  time: string; // e.g., "08:30 AM"
  staffId?: string; // "any" or a specific staff ID string
}

/* ================= HELPER: SERVING CAPACITY VALIDATOR ================= */

async function validateServingCapacity(
  businessId: string,
  staffId: string,
  startTime: Date,
  durationMinutes: number,
) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // 1. Fetch active staff members employed at this business
  const businessData = await prisma.business.findUnique({
    where: { id: businessId },
    include: { staff: true },
  });

  const availableStaff = businessData?.staff.filter((s) => s.isActive) || [];
  const totalServingCapacity = availableStaff.length;

  if (totalServingCapacity === 0) {
    return {
      isValid: false,
      reason:
        "This business currently has no active staff members available to provide services.",
    };
  }

  // 2. Query active bookings that overlap with this requested time window
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      NOT: {
        OR: [
          { startTime: { gte: endTime } }, // Existing booking starts after our requested end
          { endTime: { lte: startTime } }, // Existing booking ends before our requested start
        ],
      },
    },
  });

  // 🛑 RULE 1: Global Shop Serving Capacity
  if (overlappingBookings.length >= totalServingCapacity) {
    return {
      isValid: false,
      reason:
        "This time slot is fully booked. All available staff members are scheduled for this time window.",
    };
  }

  // 🛑 RULE 2: Specific Staff Member Availability Check
  if (staffId !== "any" && staffId) {
    const isSpecialistBusy = overlappingBookings.some(
      (b) => b.staffId === staffId,
    );
    if (isSpecialistBusy) {
      return {
        isValid: false,
        reason:
          "The requested professional is currently busy serving another client during this time slot.",
      };
    }
    return { isValid: true, assignedStaffId: staffId };
  }

  // 3. Auto-Assign Free Staff Member if "any" was selected
  const busyStaffIds = overlappingBookings
    .map((b) => b.staffId)
    .filter(Boolean) as string[];
  const freeStaff = availableStaff.find(
    (member) => !busyStaffIds.includes(member.id),
  );

  return {
    isValid: true,
    assignedStaffId: freeStaff ? freeStaff.id : null,
  };
}

/* ================= GET: Retrieve Workspace Operating Schedules ================= */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user)
      return NextResponse.json({ error: "Identity profile missing" }, { status: 400 });

    // 🛠️ 1. CALCULATE RETENTION BOUNDARY (Exactly 12 months ago from today)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const rawBookings = await prisma.booking.findMany({
      where: { 
        userId: user.id,
        // 🛠️ 2. FILTER LAYER: Explicitly drop any historical records older than 1 year
        createdAt: {
          gte: twelveMonthsAgo
        }
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
    console.error("Booking extraction failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


/* ================= POST: Create a Safe, Overlap-Validated Booking Slot ================= */
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

    // 1. Fetch treatment item to resolve its duration and price constants
    const serviceItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!serviceItem) {
      return NextResponse.json(
        { error: "Selected service offering not found" },
        { status: 404 },
      );
    }

    // 2. Parse selected components into a valid JavaScript Date object
    const appointmentStart = new Date(`${date} ${decodeURIComponent(time)}`);
    const durationMinutes = serviceItem.duration || 30;

    // 3. Run Serving Capacity validation pipeline
    const check = await validateServingCapacity(
      businessId,
      staffId || "any",
      appointmentStart,
      durationMinutes,
    );

    if (!check.isValid) {
      return NextResponse.json({ error: check.reason }, { status: 409 }); // 409 Conflict
    }

    // 4. Resolve the user's internal account profile record
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

    // 5. Create the validated multi-tenant booking record inside a database transaction
    const newBooking = await prisma.booking.create({
      data: {
        businessId,
        userId: userRecord.id,
        staffId: check.assignedStaffId, // Dynamically locks down a free staff member's ID
        startTime: appointmentStart,
        endTime: appointmentEnd,
        totalAmount: serviceItem.price,
        status: "CONFIRMED",
        queueCode: generatedPassCode,
        // Automatically link the item down into your join table configuration safely
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
    console.error("Booking creation reservation pipeline error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
