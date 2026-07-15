// app/api/admin/dashboard/route.ts
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import prisma from "@/lib/prisma";

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
    const [bookingsCount, businessesCount, itemsCount, allBookings] =
      await Promise.all([
        prisma.booking.count(),
        prisma.business.count(),
        prisma.item.count(), // Safely queries total item counts
        prisma.booking.findMany({
          select: {
            startTime: true,
            totalAmount: true, // Captures pre-computed booking total value field
            items: {
              select: {
                id: true,
                // Include any pricing metrics if available in your BookingItem table
              },
            },
          },
        }),
      ]);

    // 4. Calculate Aggregate Total Marketplace Revenue
    // Uses the pre-computed 'totalAmount' field on your Booking model safely
    const totalRevenue = allBookings.reduce((acc, booking) => {
      return acc + (booking.totalAmount || 0);
    }, 0);

    // 5. Build out high-utility dashboard matrices payload
    const dashboardData = {
      stats: {
        totalBookings: bookingsCount,
        totalBusinesses: businessesCount,
        totalServices: itemsCount,
        totalRevenue: totalRevenue.toFixed(2),
      },
      // Organized data mapping for your frontend charts components
      chartData: allBookings.map((b) => ({
        date: b.startTime,
        amount: b.totalAmount || 0,
      })),
      allBookings: allBookings.map((b) => ({
        startTime: b.startTime,
        price: b.totalAmount || 0,
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal Error";
    console.error("ADMIN_DASHBOARD_GET_ERROR:", errorMsg);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
