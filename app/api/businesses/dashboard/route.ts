import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookingStatus, ItemType } from "@prisma/client";

interface CompletedBookingRecord {
  id: string;
  totalAmount?: number | null;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaUserRecord {
  id: string;
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaRatingRecord {
  id: string;
  rating: number;
  review: string | null;
  userId: string;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: PrismaUserRecord | null;
}

export async function GET(req: Request) {
  try {
    // 1. Authenticate the caller using Clerk
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract the business slug query parameter from the request URL
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing business slug" },
        { status: 400 },
      );
    }

    // 3. Authorization Check: Verify this business belongs to the logged-in user
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, ownerId: true, owner: { select: { clerkId: true } } },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business workspace not found" },
        { status: 404 },
      );
    }

    if (business.owner.clerkId !== clerkId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this shop" },
        { status: 403 },
      );
    }

    // 4. Parallel Aggregation Execution: Run database counts safely
    const [
      servicesCount,
      productsCount,
      bookingsCount,
      revenueBookingsData,
      recentRatings,
    ] = await Promise.all([
      prisma.item
        .count({
          where: { businessId: business.id, type: ItemType.SERVICE },
        })
        .catch(() => 0),

      prisma.item
        .count({
          where: { businessId: business.id, type: ItemType.PRODUCT },
        })
        .catch(() => 0),

      prisma.booking
        .count({
          where: { businessId: business.id },
        })
        .catch(() => 0),

      // 🛠️ FIX: Track earnings using both CONFIRMED and COMPLETED statuses
      prisma.booking
        .findMany({
          where: {
            businessId: business.id,
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
            },
          },
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        .catch(() => []),

      prisma.rating
        .findMany({
          where: { businessId: business.id },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
          },
        })
        .catch(() => []),
    ]);

    // 5. Accumulate revenue sums safely using totalAmount properties from confirmed/completed rows
    const totalEarnings = (
      revenueBookingsData as CompletedBookingRecord[]
    ).reduce((sum: number, booking: CompletedBookingRecord) => {
      return sum + (booking.totalAmount || 0);
    }, 0);

    // 6. Format ratings objects using explicit model mapping interfaces
    const formattedRatings = (recentRatings as PrismaRatingRecord[]).map(
      (r: PrismaRatingRecord) => {
        const clientFirstName = r.user?.firstName || "";
        const clientLastName = r.user?.lastName || "";
        const combinedName = `${clientFirstName} ${clientLastName}`.trim();

        return {
          id: r.id,
          rating: r.rating || 5,
          review: r.review || "No descriptive comment provided.",
          createdAt: r.createdAt
            ? r.createdAt.toISOString()
            : new Date().toISOString(),
          user: {
            name: combinedName || "Anonymous Client",
            image: r.user?.image || null,
          },
          service: {
            name: "Verified Feedback",
          },
        };
      },
    );

    // Return payload properties matching frontend dashboard states precisely
    return NextResponse.json(
      {
        totalServices: servicesCount,
        totalProducts: productsCount,
        totalEarnings,
        totalBookings: bookingsCount,
        ratings: formattedRatings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Dashboard database metrics failure:", error);
    return NextResponse.json(
      { error: "Internal server processing failure" },
      { status: 500 },
    );
  }
}
