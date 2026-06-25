import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Core default Prisma v7 import instance

// ✅ POST: Synchronize and persist client-side basket states to the database
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, items } = await request.json();

    if (!businessId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required parameters: businessId and items array" },
        { status: 400 },
      );
    }

    // 1. Resolve internal sequential database User.id row from Clerk token context
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // 2. Upsert the main parent Cart entity for this specific user/business combination
    const cart = await prisma.cart.upsert({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId: businessId,
        },
      },
      update: { updatedAt: new Date() },
      create: {
        userId: user.id,
        businessId: businessId,
      },
    });

    // 3. Clear existing transaction temporary cart item records to prevent double-stacking counts
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // 4. Batch populate the nested relation child rows matching your schema constraints
    if (items.length > 0) {
      await prisma.cartItem.createMany({
        data: items.map(
          (item: { itemId: string; quantity: number; price: number }) => ({
            cartId: cart.id,
            itemId: item.itemId,
            quantity: item.quantity,
            priceAtAdd: item.price,
          }),
        ),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Multi-tenant cart synchronized successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating multi-tenant user cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart records" },
      { status: 500 },
    );
  }
}

// ✅ GET: Retrieve active cart and nested stock items for a specific tenant shop
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Query parameter businessId is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pulls parent cart structure along with its clean nested product rows in a single query
    const activeCart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId: businessId,
        },
      },
      include: {
        items: {
          include: {
            item: {
              select: {
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        cartId: activeCart?.id || null,
        businessId: activeCart?.businessId || businessId,
        items: activeCart?.items || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching multi-tenant cart items:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart logs" },
      { status: 500 },
    );
  }
}
