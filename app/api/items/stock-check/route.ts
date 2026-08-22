// app/api/items/stock-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");

  if (!idsParam || idsParam.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required 'ids' query parameter." },
      { status: 400 },
    );
  }

  const ids = Array.from(
    new Set(
      idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No valid item ids provided." },
      { status: 400 },
    );
  }

  try {
    const items = await prisma.item.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        stock: true,
        type: true,
      },
    });

    // Items that no longer exist at all (deleted/removed) still need to be
    // surfaced — the frontend treats a missing id as 0 stock.
    const found = new Map(items.map((item) => [item.id, item]));
    const results = ids.map((id) => {
      const item = found.get(id);
      return {
        itemId: id,
        stock: item ? item.stock : 0,
        type: item ? item.type : null,
        exists: Boolean(item),
      };
    });

    return NextResponse.json({ items: results });
  } catch (error) {
    console.error("STOCK_CHECK_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch current stock levels." },
      { status: 500 },
    );
  }
}
