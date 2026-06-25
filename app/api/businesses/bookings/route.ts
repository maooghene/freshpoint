import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authOwner from "@/lib/authOwner"; // FIXED: Points to database-safe utility folder location
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import
import { BookingStatus } from "@prisma/client"; // Safe type-safe enum directly from Prisma

interface BookingUpdatePayload {
  BookingId: string;
  status: BookingStatus; // Enforces strict enum limits matching your database constraints
}

// ✅ POST: Allow verified vendor space owners to alter specific booking slots (Confirm/Cancel/Complete)
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolves the internal business identifier tied to this owner profile
    const businessId = await authOwner(clerkId);

    if (!businessId) {
      return NextResponse.json(
        { error: "Unauthorized: Vendor account mapping required" },
        { status: 401 },
      );
    }

    const body: BookingUpdatePayload = await request.json();
    const { BookingId, status } = body;

    if (!BookingId || !status) {
      return NextResponse.json(
        { error: "Missing parameters: BookingId or status designation" },
        { status: 400 },
      );
    }

    // Securely mutates status row values isolated strictly to this specific tenant store
    await prisma.booking.update({
      where: {
        id: BookingId,
        businessId: businessId, // FIXED: Enforces strict data multi-tenant isolation guard bounds
      },
      data: { status },
    });

    return NextResponse.json(
      { message: "Appointment status changed and updated successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("BUSINESS_BOOKING_STATUS_POST_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ GET: Fetch all historic and live bookings registered under a specific owner's workspace
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where: {
        businessId, // FIXED: Filter isolated to pull data matching this specific workspace ID
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        address: true, // Core layout support mapping for mobile treatments and home services
        item: true, // FIXED: Swapped 'service' mapping over to pull unified treatment details
      },
      orderBy: {
        startTime: "desc", // Chronological slot ordering
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: unknown) {
    console.error("BUSINESS_BOOKINGS_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
