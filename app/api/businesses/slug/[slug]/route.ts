import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAbsoluteImageUrl } from "@/lib/resolve-image-url";
interface DatabaseItemPayload {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  image: string | null;
  duration: number | null;
  stock: number | null;
  businessId: string;
  isActive: boolean;
}
interface DatabaseSchedulePayload {
  id: string;
  day: string;
  isOff: boolean;
  staffProfileId: string;
}
interface DatabaseStaffPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId: string;
  schedules?: DatabaseSchedulePayload[];
}
export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  try {
    const params = await props.params;
    const { slug } = params;
    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 },
      );
    }
    const business = await prisma.business.findUnique({
      where: { slug: decodeURIComponent(slug) },
      include: {
        items: true,
        staff: {
          include: {
            schedules: true,
          },
        },
        // Minimal fields only — this route is public, so nothing beyond
        // what's already comparable to the public business.address exposure
        // below.
        locations: {
          where: { isActive: true },
          select: { id: true, name: true, isPrimary: true },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business workspace profile not found" },
        { status: 404 },
      );
    }
    const formattedItems = (business.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      type: item.type ? item.type.toUpperCase().trim() : "SERVICE",
      image: resolveAbsoluteImageUrl(item.image),
      duration: item.duration,
      stock:
        item.stock !== null && item.stock !== undefined
          ? Number(item.stock)
          : null,
      businessId: item.businessId,
    }));
    const aggregationData = await prisma.rating.aggregate({
      where: {
        businessId: business.id,
      },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });
    const totalReviewsCount = aggregationData._count.id;
    const averageRatingScore = aggregationData._avg.rating ?? 0.0;
    const functionalRatingString =
      totalReviewsCount > 0 ? averageRatingScore.toFixed(1) : "0.0";
    return NextResponse.json({
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status || "pending",
      description: business.description,
      image: resolveAbsoluteImageUrl(business.image),
      address: business.address,
      email: business.email,
      phone: business.phone,
      categories: business.categories || [],
      isActive: business.isActive !== false,
      rating: functionalRatingString,
      totalReviews: totalReviewsCount,
      items: formattedItems,
      staff: business.staff || [],
      locations: business.locations || [],
    });
  } catch (error) {
    console.error("Critical public workspace slug API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
