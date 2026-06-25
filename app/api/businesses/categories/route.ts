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

    const { categories } = await request.json();

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: "Categories parameter must be a string array" },
        { status: 400 },
      );
    }

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
