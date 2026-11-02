import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing identity reference parameter" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, businessId: true, business: { select: { ownerId: true } } },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 });
    }
    const allowed = await authorizeBusinessAccess({
      businessId: booking.businessId,
      ownerId: booking.business.ownerId,
      systemUserId: user.id,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { isVerifiedByStaff: true },
    });

    return NextResponse.json(
      { success: true, updatedBooking },
      { status: 200 },
    );
  } catch (error) {
    console.error("Staff authorization verify exception:", error);
    return NextResponse.json(
      { error: "Verification adjustment exception caught" },
      { status: 500 },
    );
  }
}
