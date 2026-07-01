import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookingStatus } from "@prisma/client";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    // If not logged in, return zero safely
    if (!clerkId) {
      return NextResponse.json({ bookingCount: 0 }, { status: 200 });
    }

    // Resolve native system user profile CUID from the Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ bookingCount: 0 }, { status: 200 });
    }

    // Aggregate confirmed future or active bookings for this user
    const bookingCount = await prisma.booking.count({
      where: {
        userId: user.id,
        status: BookingStatus.CONFIRMED,
        startTime: { gte: new Date() }, // Shows only upcoming appointments
      },
    });

    return NextResponse.json({ bookingCount }, { status: 200 });
  } catch (error) {
    console.error("Navigation count exception:", error);
    return NextResponse.json({ bookingCount: 0 }, { status: 500 });
  }
}
