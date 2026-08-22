import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CategoryScope } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "PRODUCT" | "SERVICE"

    // 🚀 FIXED: Strongly typed array using your Prisma CategoryScope enum values to prevent type assertion bypasses
    const scopeFilter: CategoryScope[] =
      type === "PRODUCT"
        ? ["PRODUCT", "BOTH"]
        : type === "SERVICE"
          ? ["SERVICE", "BOTH"]
          : ["PRODUCT", "SERVICE", "BOTH"];

    const categories = await prisma.itemCategory.findMany({
      where: {
        isActive: true,
        scope: { in: scopeFilter },
      },
      select: { id: true, name: true, scope: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
