import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookingStatus, UserRole } from "@prisma/client";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    // If not logged in, return defaults safely
    if (!clerkId) {
      return NextResponse.json(
        { bookingCount: 0, role: "CUSTOMER" },
        { status: 200 },
      );
    }

    // Resolve system profile CUID and user role from the Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { bookingCount: 0, role: "CUSTOMER" },
        { status: 200 },
      );
    }

    let bookingCount = 0;

    // CORRECTED: Calculate an explicit West Africa Time (WAT - UTC+1) timestamp
    // to prevent server runtime timezone drift for Nigerian marketplace users
    const serverTime = new Date();
    const watOffsetMs = 1 * 60 * 60 * 1000;
    const nowInNigeria = new Date(serverTime.getTime() + watOffsetMs);

    // DYNAMIC METRIC AGGREGATION BASED ON DB ROLE
    if (user.role === UserRole.BUSINESS_OWNER) {
      // For owners, count all upcoming confirmed appointments across their businesses
      bookingCount = await prisma.booking.count({
        where: {
          business: {
            ownerId: user.id,
          },
          status: BookingStatus.CONFIRMED,
          startTime: { gte: nowInNigeria },
        },
      });
    } else if (user.role === UserRole.STAFF) {
      // For staff, count upcoming confirmed appointments assigned specifically to them
      bookingCount = await prisma.booking.count({
        where: {
          staffId: user.id,
          status: BookingStatus.CONFIRMED,
          startTime: { gte: nowInNigeria },
        },
      });
    } else {
      // For customers, count their personal upcoming appointments
      bookingCount = await prisma.booking.count({
        where: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          startTime: { gte: nowInNigeria },
        },
      });
    }

    return NextResponse.json(
      {
        bookingCount,
        role: user.role,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Navigation count exception:", error);
    return NextResponse.json(
      { bookingCount: 0, role: "CUSTOMER" },
      { status: 500 },
    );
  }
}
