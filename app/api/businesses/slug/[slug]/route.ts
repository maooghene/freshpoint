// app/api/businesses/slug/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing required slug parameter" },
        { status: 400 },
      );
    }

    // Query Neon Postgres to pull the fresh data record row
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        image: true,
        status: true, // 🔑 CRITICAL FIX: Explicitly returns your live string column parameter ("approved")
        isActive: true, // 🔑 CRITICAL FIX: Tracks your tenant activation visibility flags
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business data row profile space not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error) {
    console.error("BUSINESS_SLUG_GET_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
