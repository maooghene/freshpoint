import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Defensive runtime interceptor that catches and repairs corrupted
 * legacy ImageKit string parameters saved by older buggy features.
 */
function cleanLegacyImageUrl(url: string | null): string | null {
  if (!url) return null;

  // Rule 1: Strip out accidental literal string quotes inside parameters
  let cleaned = url.replace(/%22/g, "").replace(/"/g, "");

  // Rule 2: Repair broken transformation strings (e.g., tr:w-"768" -> tr:w-768)
  cleaned = cleaned.replace(/tr:w-\[?["']?(\d+)["']?\]?/g, "tr:w-$1");

  return cleaned;
}

export async function handleGetBookingHistory(): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Identity profile missing" },
        { status: 400 },
      );
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const rawBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: twelveMonthsAgo },
      },
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
      createdAt: b.createdAt.toISOString(),
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
          // CORRECTED: Intercept and repair image parameters on the fly
          image: cleanLegacyImageUrl(i.item?.image || null),
          type: i.item?.type || "SERVICE",
        },
      })),
      ratings: b.ratings,
    }));

    return NextResponse.json(formattedBookings, { status: 200 });
  } catch (error: unknown) {
    const errorTrace =
      error instanceof Error ? error.message : "Fatal collection error context";
    console.error("Booking history extraction failure:", errorTrace);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
