import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin"; // FIXED: Uses edge-safe backend location
import prisma from "@/lib/prisma"; // FIXED: Core default Prisma v7 import instance

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the active Clerk session identity
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // 2. Validate strict administrative authorization privileges
    const isAdmin = await authAdmin(clerkId);
    if (!isAdmin) {
      return NextResponse.json("Forbidden: Admin access required", {
        status: 403,
      });
    }

    // 3. Multi-Tenant Parallel Queries (Performance optimization)
    const [bookingsCount, businessesCount, servicesCount, allBookings] =
      await Promise.all([
        prisma.booking.count(),
        prisma.business.count(), // FIXED: Replaced salon with business schema model
        prisma.item.count({
          where: { type: "SERVICE" }, // FIXED: Filters item table specifically for services
        }),
        prisma.booking.findMany({
          select: {
            startTime: true,
            itemId: true, // FIXED: Replaced serviceId with itemId parameter
            item: {
              // FIXED: Replaced service model selection with item relation layer
              select: {
                price: true,
              },
            },
          },
        }),
      ]);

    // 4. Calculate Aggregate Total Marketplace Revenue
    const totalRevenue = allBookings.reduce((acc, booking) => {
      return acc + (booking.item?.price || 0);
    }, 0);

    // 5. Build out high-utility dashboard matrices payload
    const dashboardData = {
      stats: {
        totalBookings: bookingsCount,
        totalBusinesses: businessesCount,
        totalServices: servicesCount,
        totalRevenue: totalRevenue.toFixed(2),
      },
      // Organized data mapping for your frontend recharts components
      chartData: allBookings.map((b) => ({
        date: b.startTime,
        amount: b.item?.price || 0,
      })),
      allBookings: allBookings.map((b) => ({
        startTime: b.startTime,
        price: b.item?.price || 0,
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("ADMIN_DASHBOARD_GET_ERROR:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
