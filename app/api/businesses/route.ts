import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolveAbsoluteImageUrl } from "@/lib/resolve-image-url";

export const dynamic = "force-dynamic";

// ✅ GET: Fetch all active wellness spaces with optional keyword, address, and category array search filters
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();

    const whereClause: Prisma.BusinessWhereInput = {
      isActive: true,
      status: "approved",
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          categories: {
            hasSome: [search],
          },
        },
      ];
    }

    const businesses = await prisma.business.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        _count: {
          select: {
            items: true,
            ratings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedBusinesses = businesses.map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      address: business.address,
      image: resolveAbsoluteImageUrl(business.image), // ✅ fixed: was raw `business.image || null`
      description: business.description || null,
      categories: business.categories || [],
      sittingCapacity: business.sittingCapacity,
      isActive: business.isActive,
      owner: business.owner,
      totalServices: business._count.items,
      totalReviews: business._count.ratings,
      rating: business._count.ratings > 0 ? "4.8" : "New",
    }));

    return NextResponse.json(formattedBusinesses, { status: 200 });
  } catch (error: unknown) {
    console.error("PUBLIC_MARKET_EXPLORE_API_ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to fetch wellness marketplace spaces", message },
      { status: 500 },
    );
  }
}
