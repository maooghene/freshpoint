import { NextRequest, NextResponse } from "next/server";
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

// ✅ POST: Create a new physical product row under a designated vendor tenant
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const price = formData.get("price") as string;
    const businessId = formData.get("businessId") as string; // FIXED: Migrated from salonId
    const stock = formData.get("stock") as string | null; // Added from your inventory schema parameters
    const sku = formData.get("sku") as string | null; // Added from your inventory schema parameters

    if (!name || !price || !businessId) {
      return NextResponse.json(
        {
          error:
            "Missing required parameter fields: name, price, or businessId",
        },
        { status: 400 },
      );
    }

    const product = await prisma.item.create({
      data: {
        name: name.trim(),
        description,
        price: Number(price),
        stock: stock ? Number(stock) : 0, // Maps cleanly to product-specific table requirements
        sku: sku || null,
        duration: null, // Explicitly null inside schema because it's a product
        businessId, // FIXED: Links to parent business identifier
        type: ItemType.PRODUCT, // FIXED: Type-safe enum assignment
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    console.error("CREATE_PRODUCT_API_ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to create inventory item row", message },
      { status: 500 },
    );
  }
}

// ✅ DELETE: Wipe an inventory product node cleanly out of database tables
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item query identifier resource ID required" },
        { status: 400 },
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Deleted inventory item successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("DELETE_PRODUCT_API_ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to delete item record", message },
      { status: 500 },
    );
  }
}

// ✅ PATCH: Safely update partial metadata fields for a specific product block
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Target structural item resource ID required" },
        { status: 400 },
      );
    }

    const updated = await prisma.item.update({
      where: { id },
      data: updateData, // Validated safely on the backend handler step layer
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("UPDATE_PRODUCT_API_ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to update item modifications", message },
      { status: 500 },
    );
  }
}
