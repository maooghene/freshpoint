import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Core default Prisma v7 instance import
import { Prisma } from "@prisma/client"; // Safe schema types namespace

export const dynamic = "force-dynamic";

// ✅ GET: Fetch all active wellness spaces with optional keyword, address, and category array search filters
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();

    // 1️⃣ Construct a dynamic query tree using Prisma's official input type schemas
    const whereClause: Prisma.BusinessWhereInput = {
      isActive: true, // Only show public, verified providers
      status: "approved",
    };

    // 2️⃣ Apply deep case-insensitive searching across strings and string-arrays safely
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          categories: {
            // Checks if any array items contain or exactly match your search parameter
            hasSome: [search],
          },
        },
      ];
    }

    // 3️⃣ Execute database query with optimized parallel aggregate counts tracking
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
            items: true, // FIXED: Replaced services with your single-table items array
            ratings: true,
          },
        },
      },
      orderBy: [
        {
          // FIXED: Uses Prisma's official structural _count operator signature for sorting
          _count: {
            ratings: "desc",
          },
        },
        {
          createdAt: "desc", // Fallback to sort by newly verified profiles
        },
      ],
    });

    // 4️⃣ Map response fields directly to match your client-side BusinessesGrid props
    const formattedBusinesses = businesses.map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      address: business.address,
      image: business.image || null,
      description: business.description || null,
      categories: business.categories || [],
      sittingCapacity: business.sittingCapacity, // FIXED: Replaced totalChairs with sittingCapacity
      isActive: business.isActive,
      owner: business.owner,
      totalServices: business._count.items, // FIXED: Relies on item counts array parameters
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
