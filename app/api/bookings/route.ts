import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 import instance
import { auth } from "@clerk/nextjs/server"; // FIXED: Corrected modern Clerk SDK package destination

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1️⃣ Resolve the internal structural database User.id row from Clerk identity hook
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not registered in platform logs" },
        { status: 404 },
      );
    }

    // 2️⃣ Fetch multi-tenant booking records scoped securely to the local relational ID
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id, // FIXED: Queries using internal relational sequential user ID matches
      },

      // ✅ FORCE CLEAN MULTI-TENANT WORKSPACE STRUCTURE
      select: {
        id: true,
        startTime: true,
        status: true,

        item: {
          // FIXED: Swapped 'service' relation filter parameter to match 'item' model rules
          select: {
            name: true,
            price: true,
            image: true,
          },
        },

        business: {
          // FIXED: Swapped 'salon' model mapping parameter out for 'business' relational tracking keys
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },

      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error: unknown) {
    console.error("BOOKINGS API ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Server error fetching appointments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
