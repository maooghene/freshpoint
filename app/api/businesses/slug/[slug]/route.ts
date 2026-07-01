import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import
import { ItemType } from "@prisma/client"; // Safe type-safe enum directly from Prisma

interface RouteParams {
  params: Promise<{ slug: string }>; // Handles async parameters unwrapping matching Next.js 16 requirements
}

// ✅ GET: Fetch complete workspace profile info, services, and retail products via its unique slug string
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Unique business slug identifier parameter is required" },
        { status: 400 },
      );
    }

    // 1️⃣ Fetch base business venue metadata logs matching your schema mappings
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            ratings: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Wellness space workspace profile not found" },
        { status: 404 },
      );
    }

    // 2️⃣ Fetch ONLY treatments and services linked to this business ID from the shared table
    const services = await prisma.item.findMany({
      where: {
        businessId: business.id,
        type: ItemType.SERVICE, // FIXED: Type-safe enum check configuration
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3️⃣ Fetch ONLY physical retail stock items linked to this business ID from the shared table
    const products = await prisma.item.findMany({
      where: {
        businessId: business.id,
        type: ItemType.PRODUCT, // FIXED: Type-safe enum check configuration
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4️⃣ Return a clean aggregate payload directly matching your frontend components requirements
    return NextResponse.json(
      {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        image: business.image,
        address: business.address,
        email: business.email,
        phone: business.phone,
        categories: business.categories,
        isActive: business.isActive,

        totalReviews: business._count.ratings,
        rating: business._count.ratings > 0 ? "4.8" : "New", // Hardcoded fallback until live aggregate reviews trigger tasks are written

        items: [...services, ...products],
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("GET_BUSINESS_BY_SLUG_CRITICAL_ERROR:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown backend data mapping exception";
    return NextResponse.json(
      {
        error:
          "Something went wrong during vendor data fetching transformations",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
