import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    console.log("📌 Freshpoint Inventory API called with item ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing item resource identification parameter" },
        { status: 400 },
      );
    }

    const item = await prisma.item.findUnique({
      where: {
        id: id.trim(),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            address: true,
            staff: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ratings: true,
      },
    });

    if (!item) {
      console.log("❌ Item resource not found with database ID:", id);
      return NextResponse.json(
        { error: "Requested product or treatment service not found" },
        { status: 404 },
      );
    }

    console.log("✅ Inventory item fetched successfully:", item.name);
    return NextResponse.json(item, { status: 200 });
  } catch (error: unknown) {
    console.error("🔥 INDIVIDUAL_ITEM_SPEC_GET_ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown backend data mapping exception";
    return NextResponse.json(
      {
        error: "Server error retrieving inventory specifications",
        message,
      },
      { status: 500 },
    );
  }
}
