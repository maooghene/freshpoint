import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Missing required business identification token" },
        { status: 400 },
      );
    }

    const businessOrders = await prisma.order.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 🚀 THE UNIFIED DATA BRIDGE PASS:
    // Ensures 'code' properties (FP-2607-XXXXX) flow matching down to your dashboard cards!
    return NextResponse.json({
      success: true,
      orders: businessOrders.map((order) => ({
        id: order.id,
        code: order.code, // 👈 PASSES SHORTCODE RIGHT HERE TO MATCH YOUR CUSTOMER RECEIPT DATA LAWS
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        user: order.user,
        items: order.items.map((line) => ({
          id: line.id,
          quantity: line.quantity,
          price: Number(line.price),
          item: {
            name: line.item?.name || "Product Item",
            image: line.item?.image || null,
          },
        })),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not aggregate merchant orders array" },
      { status: 500 },
    );
  }
}
