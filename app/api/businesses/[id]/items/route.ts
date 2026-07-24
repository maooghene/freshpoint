// app/api/businesses/[id]/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";
import { uploadItemImage, resolveItemImageUrl } from "./image-utils";
import { parseItemFormData, verifyItemTenantOwnership } from "./helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Resolves the route param (which may be a slug OR a cuid) to the real business cuid.
async function resolveBusinessId(slugOrId: string): Promise<string | null> {
  const business = await prisma.business.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
    },
    select: { id: true },
  });
  return business?.id ?? null;
}

// 🔓 GET: Accessible catalog reader (Updated to support management states and expected payload shapes)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: slugOrId } = await params;

    if (!slugOrId) {
      return NextResponse.json(
        { error: "Missing business identifier parameter" },
        { status: 400 },
      );
    }

    const businessId = await resolveBusinessId(slugOrId);
    if (!businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // 💡 ROOT CAUSE FIX: Removed "isActive: true" so all database records pull through to the dashboard lists
    const items = await prisma.item.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        type: true,
        duration: true,
        stock: true,
        isActive: true, // Included so that the front-end toggle handles states accurately
        createdAt: true, // Included for the frontend byNewest sorting function
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 💡 ROOT CAUSE FIX: Return "items" key matching the frontend axios call structure perfectly
    return NextResponse.json({ success: true, items: items }, { status: 200 });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 🔐 POST: Create a new inventory record element
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: routeSlugOrId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const targetBusinessId = await resolveBusinessId(routeSlugOrId);
    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== targetBusinessId) {
      return NextResponse.json(
        { error: "Unauthorized tenant bounds matching" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const parsedData = await parseItemFormData(formData);

    if (!parsedData.name || isNaN(parsedData.price)) {
      return NextResponse.json(
        { error: "Missing required catalog fields" },
        { status: 400 },
      );
    }

    // 🚀 FASHION VARIANT HANDLING: Extract raw JSON variant data from the formData stream
    const variantsRaw = formData.get("variants") as string | null;
    let parsedVariants: Array<{ size: string; color: string; stock: number }> =
      [];

    if (parsedData.type === "PRODUCT" && variantsRaw) {
      try {
        parsedVariants = JSON.parse(variantsRaw);
      } catch (e) {
        console.error("FreshPoint Options Variant Parsing Error:", e);
        return NextResponse.json(
          { error: "Invalid clothing options structural format" },
          { status: 400 },
        );
      }
    }

    // Adjust base product stock allocation if explicit sizes or colors are mapped
    let adjustedStock = parsedData.stock;
    if (parsedData.type === "PRODUCT" && parsedVariants.length > 0) {
      adjustedStock = parsedVariants.reduce((sum, v) => sum + v.stock, 0);
    }

    const rawImageUrl = formData.get("imageUrl") as string | null;
    const imageUrlString = resolveItemImageUrl(rawImageUrl);

    // 🌟 TRANSACTION GUARD: Atomically link Parent Items and Child Variants together
    const resultItem = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          businessId,
          type: parsedData.type,
          name: parsedData.name,
          description: parsedData.description,
          price: parsedData.price,
          duration: parsedData.duration,
          stock: adjustedStock,
          categoryId: parsedData.categoryId,
          image: imageUrlString,
          isActive: true,
        },
      });

      // Batch write choices cleanly under the newly minted unique parent itemId reference
      if (parsedData.type === "PRODUCT" && parsedVariants.length > 0) {
        await tx.itemVariant.createMany({
          data: parsedVariants.map((v) => ({
            itemId: item.id,
            size: v.size || null,
            color: v.color || null,
            stock: v.stock,
            price: parsedData.price, // Bind variant price to base item price
          })),
        });
      }

      return item;
    });

    return NextResponse.json(
      { message: `${parsedData.type} created successfully!`, item: resultItem },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}


// 🔐 PUT: Modify properties for an existing service or product row element
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: routeSlugOrId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const targetBusinessId = await resolveBusinessId(routeSlugOrId);
    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== targetBusinessId) {
      return NextResponse.json(
        { error: "Unauthorized tenant bounds matching" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const parsedData = await parseItemFormData(formData);

    if (!parsedData.id) {
      return NextResponse.json(
        { error: "Missing required catalog identifier ID" },
        { status: 400 },
      );
    }

    const existing = await verifyItemTenantOwnership(parsedData.id, businessId);
    if (!existing) {
      return NextResponse.json(
        { error: "Requested inventory resource not found" },
        { status: 404 },
      );
    }

    // 🚀 FASHION VARIANT HANDLING: Pull structural parameters from incoming FormData
    const variantsRaw = formData.get("variants") as string | null;
    let parsedVariants: Array<{ size: string; color: string; stock: number }> = [];
    let hasExplicitVariants = false;

    if (parsedData.type === "PRODUCT" && variantsRaw) {
      try {
        parsedVariants = JSON.parse(variantsRaw);
        hasExplicitVariants = true;
      } catch (e) {
        console.error("FreshPoint Edit Options Variant Parsing Error:", e);
        return NextResponse.json(
          { error: "Invalid clothing options structural format" },
          { status: 400 },
        );
      }
    }

    // Calculate aggregated item level stock allocations if specific variants are appended
    let adjustedStock = parsedData.stock;
    if (parsedData.type === "PRODUCT" && hasExplicitVariants && parsedVariants.length > 0) {
      adjustedStock = parsedVariants.reduce((sum, v) => sum + v.stock, 0);
    }

    let imageUrlString = existing.image;
    if (parsedData.imageFile && parsedData.imageFile.size > 0) {
      const rawUrl = await uploadItemImage(parsedData.imageFile);
      imageUrlString = resolveItemImageUrl(rawUrl);
    }

    // 🌟 TRANSACTION GUARD: Atomically synchronize Item fields and Variant items
    const itemId = parsedData.id;
    if (!itemId) {
      return NextResponse.json(
        { error: "Missing required catalog identifier ID" },
        { status: 400 },
      );
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // 1. Update the parent inventory container row properties
      const item = await tx.item.update({
        where: { id: itemId},
        data: {
          type: parsedData.type,
          name: parsedData.name,
          description: parsedData.description,
          price: parsedData.price,
          duration: parsedData.duration,
          stock: adjustedStock,
          categoryId: parsedData.categoryId,
          image: imageUrlString,
        },
      });

      // 2. If the update payload includes explicit fashion choices, sync them via wipe-and-recreate
      if (parsedData.type === "PRODUCT" && hasExplicitVariants) {
        // Clear out the stale entries
        await tx.itemVariant.deleteMany({
          where: { itemId: item.id },
        });

        // Batch insert the newly mapped choices cleanly
        if (parsedVariants.length > 0) {
          await tx.itemVariant.createMany({
            data: parsedVariants.map((v) => ({
              itemId: item.id,
              size: v.size || null,
              color: v.color || null,
              stock: v.stock,
              price: parsedData.price, // Default variant price to base item price
            })),
          });
        }
      }

      return item;
    });

    return NextResponse.json(
      { message: "Updated successfully", item: updatedItem },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 🔐 DELETE: Wipe an offering completely out of database tables safely
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: routeSlugOrId } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Missing item identifier ID" },
        { status: 400 },
      );

    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const targetBusinessId = await resolveBusinessId(routeSlugOrId);
    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== targetBusinessId) {
      return NextResponse.json(
        { error: "Unauthorized tenant bounds matching" },
        { status: 401 },
      );
    }

    const item = await verifyItemTenantOwnership(id, businessId);
    if (!item) {
      return NextResponse.json(
        { error: "Inventory record not found or access denied" },
        { status: 404 },
      );
    }

    // 🚀 NOTE: Because your schema declares 'onDelete: Cascade' on the ItemVariant relations,
    // deleting this parent item atomizes and auto-clears all attached child variants inside Postgres.
    await prisma.item.delete({ where: { id } });
    
    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
