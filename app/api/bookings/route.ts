import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
      return NextResponse.json(
        { error: "Identity profile missing" },
        { status: 400 },
      );

    const rawBookings = await prisma.booking.findMany({
      where: { userId: user.id },
      // 🌟 KEY FIX: Force descending order on createdAt so newest entries load first!
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
      createdAt: b.createdAt.toISOString(), // 🌟 Pass creation date to calculate "time ago"
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
