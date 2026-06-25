import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";

// ✅ POST: Universal Toggle for BOTH Services and Products
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 },
      );
    }

    // 1. Verify vendor ownership and resolve the unique business ID
    const businessId = await authOwner(clerkId);
    if (!businessId) {
      return NextResponse.json(
        { error: "Unauthorized: Business profile not found" },
        { status: 401 },
      );
    }

    // 2. Find the item (Prisma automatically scans the unified table for products OR services)
    const item = await prisma.item.findUnique({
      where: {
        id: itemId,
        businessId: businessId, // Security: Ensures merchants can only edit their own shop items
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Requested product or service item not found" },
        { status: 404 },
      );
    }

    // 3. Toggle the boolean visibility state cleanly
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        isActive: !item.isActive,
      },
    });

    // Dynamic log feedback to clearly tell your merchant dashboard what was toggled
    const itemTypeName = updatedItem.type === "PRODUCT" ? "Product" : "Service";

    return NextResponse.json(
      {
        message: `${itemTypeName} status configured as ${updatedItem.isActive ? "Active" : "Inactive"}`,
        isActive: updatedItem.isActive,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Toggle Item Status Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
