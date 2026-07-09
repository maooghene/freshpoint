import { auth } from "@clerk/nextjs/server"; // CORRECTED: Added missing top-level import and updated to async auth
import { NextRequest, NextResponse } from "next/server";
import authOwner from "@/lib/authOwner";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

interface OrderUpdatePayload {
  orderId: string;
  status: OrderStatus;
}

// ✅ GET: Fetch all historic and active physical product orders registered under a specific owner's workspace
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolves the internal business identifier tied to this owner profile
    const businessId = await authOwner(clerkId);
    if (!businessId) {
      return NextResponse.json(
        { error: "Unauthorized: Vendor account mapping required" },
        { status: 401 },
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        businessId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        address: true,
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: unknown) {
    console.error("BUSINESS_ORDERS_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ PATCH: Update Order Status (PENDING -> SHIPPED -> DELIVERED) with strict role authorization
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await authOwner(clerkId);
    if (!businessId) {
      return NextResponse.json(
        { error: "Unauthorized: Vendor account mapping required" },
        { status: 401 },
      );
    }

    const body: OrderUpdatePayload = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing parameters: orderId or status designation" },
        { status: 400 },
      );
    }

    // Verify the order actually belongs to this merchant's business before updating it (Security boundary check)
    const targetOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId,
      },
    });

    if (!targetOrder) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(
      {
        message: "Order fulfillment status updated successfully",
        order: updatedOrder,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("BUSINESS_ORDERS_PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
