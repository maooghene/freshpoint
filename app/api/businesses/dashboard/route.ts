import { getAuth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma"; // Core default Prisma v7 instance import

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIXED: Uses findFirst because ownerId is no longer designated as a unique key descriptor constraint
    const businessData = await prisma.business.findFirst({
      where: {
        ownerId: clerkId,
      },
      include: {
        bookings: {
          include: {
            item: {
              select: { price: true },
            },
          },
        },
        orders: {
          where: { status: "DELIVERED" },
          select: { totalAmount: true },
        },
        ratings: {
          include: {
            user: {
              select: { firstName: true, lastName: true, image: true },
            },
            item: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        items: true,
      },
    });

    if (!businessData) {
      return NextResponse.json(
        { error: "Wellness space business profile not found" },
        { status: 404 },
      );
    }

    // 2️⃣ Separate available offerings catalog by table enum types
    const allItems = businessData.items || [];
    const totalServices = allItems.filter(
      (item) => item.type === "SERVICE",
    ).length;
    const totalProducts = allItems.filter(
      (item) => item.type === "PRODUCT",
    ).length;

    // 3️⃣ Calculate Booking Earnings (Services)
    const bookingEarnings = businessData.bookings.reduce(
      (acc: number, booking) => {
        if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
          return acc + (booking.item?.price || 0);
        }
        return acc;
      },
      0,
    );

    // 4️⃣ Calculate Product Earnings from Delivered Orders
    const productEarnings = businessData.orders.reduce((acc: number, order) => {
      return acc + (order.totalAmount || 0);
    }, 0);

    const totalEarnings = Math.round(bookingEarnings + productEarnings);

    return NextResponse.json(
      {
        ratings: businessData.ratings || [],
        totalBookings: businessData.bookings.length,
        totalEarnings,
        totalServices,
        totalProducts,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Owner Dashboard Metrics Fetch Error Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
