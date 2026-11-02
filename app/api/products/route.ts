import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import
import { ItemType } from "@prisma/client"; // Safe type-safe enum directly from Prisma

// ✅ GET: Fetch all active retail products listed across verified business spaces
export async function GET() {
  try {
    const products = await prisma.item.findMany({
      where: {
        type: ItemType.PRODUCT, // FIXED: Type-safe enum check configuration
      },
      include: {
        ratings: {
          select: {
            createdAt: true,
            rating: true,
            review: true,
            user: {
              select: { firstName: true, image: true },
            },
          },
        },
        business: true, // FIXED: Migrated from salon relation layer
      },
      orderBy: { createdAt: "desc" },
    });

    // Securely filter on the backend to only display stock from verified, active workspaces
    const filtered = products.filter((p) => p.business?.isActive);

    return NextResponse.json({ products: filtered });
  } catch (error: unknown) {
    console.error("FETCH_PRODUCTS_API_ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to fetch products", message },
      { status: 500 },
    );
  }
}

// NOTE: The POST, DELETE and PATCH handlers that used to live here were
// removed. They had no authentication or ownership check, so any signed-in
// user could create, delete or rewrite any business's products, and nothing
// in the app called them. Catalog writes go through
// /api/businesses/[id]/items, which verifies tenant ownership.
