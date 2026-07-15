import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // CORRECTED: Replaced getAuth to fix 401 token drops
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";
import { uploadItemImage, resolveItemImageUrl } from "./image-utils";
import { parseItemFormData, verifyItemTenantOwnership } from "./helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 🔓 GET: Publicly accessible catalog reader (Bypasses authentication filters for browser users)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: businessId } = await params;

    if (!businessId) {
      return NextResponse.json(
        { error: "Missing business identifier parameter" },
        { status: 400 },
      );
    }

    const services = await prisma.item.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        type: true,
        duration: true,
        stock: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: services },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// 🔐 POST: Create a new inventory record element
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: routeBusinessId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== routeBusinessId) {
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

    let imageUrlString: string | null = null;
    if (parsedData.imageFile && parsedData.imageFile.size > 0) {
      const rawUrl = await uploadItemImage(parsedData.imageFile);
      imageUrlString = resolveItemImageUrl(rawUrl);
    }

    const newItem = await prisma.item.create({
      data: {
        businessId,
        type: parsedData.type,
        name: parsedData.name,
        description: parsedData.description,
        price: parsedData.price,
        duration: parsedData.duration,
        stock: parsedData.stock,
        image: imageUrlString,
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: `${parsedData.type} created successfully!`, item: newItem },
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
    const { id: routeBusinessId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== routeBusinessId) {
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

    let imageUrlString = existing.image;
    if (parsedData.imageFile && parsedData.imageFile.size > 0) {
      const rawUrl = await uploadItemImage(parsedData.imageFile);
      imageUrlString = resolveItemImageUrl(rawUrl);
    }

    const updatedItem = await prisma.item.update({
      where: { id: parsedData.id },
      data: {
        type: parsedData.type,
        name: parsedData.name,
        description: parsedData.description,
        price: parsedData.price,
        duration: parsedData.duration,
        stock: parsedData.stock,
        image: imageUrlString,
      },
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
    const { id: routeBusinessId } = await params;
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

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== routeBusinessId) {
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
