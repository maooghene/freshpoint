import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/utils/slotEngine";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const paramsObj = await context.params;
  const params = paramsObj as { id: string };
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // "2026-07-24"
  const itemId = searchParams.get("itemId");

  if (!date || !itemId) {
    return NextResponse.json(
      { error: "Missing required parameters: date and itemId" },
      { status: 400 },
    );
  }

  try {
    // Look up the real service duration server-side — never trust a client-supplied number.
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { duration: true, businessId: true, isActive: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (item.businessId !== params.id) {
      return NextResponse.json(
        { error: "Service does not belong to this business" },
        { status: 400 },
      );
    }

    if (!item.isActive) {
      return NextResponse.json(
        { error: "This service is currently unavailable" },
        { status: 422 },
      );
    }

    const slots = await getAvailableSlots({
      businessId: params.id,
      serviceDurationMinutes: item.duration || 30,
      dateStr: date,
    });

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
