import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteSegmentContext {
  params: Promise<{
    itemId: string;
  }>;
}

// ✅ GET: Fetch approved ratings for one specific product or service item
export async function GET(req: NextRequest, context: RouteSegmentContext) {
  try {
    const { itemId } = await context.params;

    if (!itemId) {
      return NextResponse.json(
        { error: "Targeted item identification key parameter is required" },
        { status: 400 },
      );
    }

    const itemRatings = await prisma.rating.findMany({
      where: {
        itemId: itemId,
        isApproved: true,
      },
      select: {
        id: true,
        rating: true,
        review: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(itemRatings, { status: 200 });
  } catch (error: unknown) {
    console.error("PER_ITEM_RATINGS_FETCH_FAILURE:", error);
    return NextResponse.json(
      { error: "Failed to cleanly stream catalog feedback channels" },
      { status: 500 },
    );
  }
}
