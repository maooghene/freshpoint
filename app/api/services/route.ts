import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import
import { ItemType } from "@prisma/client"; // Safe type-safe enum directly from Prisma

// ✅ GET: Fetch all active scheduling treatments and services across verified businesses
export async function GET() {
  try {
    const services = await prisma.item.findMany({
      where: {
        isActive: true,
        type: ItemType.SERVICE, // FIXED: Forces the shared table to ONLY return services
      },
      include: {
        ratings: {
          // FIXED: Relies on correct plural 'ratings' relation key
          select: {
            createdAt: true,
            rating: true,
            review: true,
            user: {
              select: {
                firstName: true, // FIXED: Matches your schema name variables
                image: true,
              },
            },
          },
        },
        business: true, // FIXED: Needed for active vendor verification checks
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // ✅ Filter out treatments belonging to currently suspended or unapproved businesses
    const filteredServices = services.filter((s) => s.business?.isActive);

    return NextResponse.json({ services: filteredServices }, { status: 200 });
  } catch (error: unknown) {
    console.error("PUBLIC_SERVICES_FEED_API_ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to fetch services feed", message },
      { status: 500 },
    );
  }
}
