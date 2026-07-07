import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ GET: Fetch ratings filtered by Business context (?businessId=) with strict scope isolation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const mode = searchParams.get("mode");

    if (!businessId) {
      return NextResponse.json(
        {
          error: "Missing required query route mapping parameter (businessId)",
        },
        { status: 400 },
      );
    }

    const isPublicExplore =
      request.headers.get("referer")?.includes("/explore") ?? true;

    // 🌟 BRANCH A: Handle General Storefront Wall Dropdown Lookups (STRICT VENUE MODE)
    if (mode === "BUSINESS_ONLY") {
      // 🌟 FIXED: Queries rows where itemId is null OR an empty string to handle different database representations
      const generalVenueRatings = await prisma.rating.findMany({
        where: {
          businessId: businessId,
          OR: [{ itemId: null }, { itemId: "" }],
          ...(isPublicExplore ? { isApproved: true } : {}),
        },
        select: {
          id: true,
          rating: true,
          review: true,
          isApproved: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(generalVenueRatings, { status: 200 });
    }

    // 🌟 BRANCH B: Standard Flat Fetch Loader (Used for Admin Dashboard Review Panels)
    const fallbackRatingsFeed = await prisma.rating.findMany({
      where: {
        businessId: businessId,
        ...(isPublicExplore ? { isApproved: true } : {}),
      },
      select: {
        id: true,
        rating: true,
        review: true,
        isApproved: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        item: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(fallbackRatingsFeed, { status: 200 });
  } catch (error: unknown) {
    console.error("BUSINESS_RATINGS_GET_API_FAILURE:", error);
    return NextResponse.json(
      { error: "Could not safely process business feedback arrays" },
      { status: 500 },
    );
  }
}
