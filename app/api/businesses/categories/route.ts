import { z } from "zod";
import { parseJsonBody, text } from "@/lib/validation";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";

// ✅ PUT: Dynamically update categorical tags array parameters for an active space
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = await parseJsonBody(
      request,
      z.object({ categories: z.array(text(50)).max(30) }),
    );
    if (!parsed.ok) return parsed.response;
    const { categories } = parsed.data;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        categories: categories.map((c) => c.trim().toUpperCase()),
      },
      select: { categories: true },
    });

    return NextResponse.json(
      {
        message: "Categories updated successfully",
        categories: updatedBusiness.categories,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UPDATE_CATEGORIES_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
