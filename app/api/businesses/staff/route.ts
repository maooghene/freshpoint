import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";

// ✅ GET: Fetch all staff team profiles registered to this tenant space
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const staff = await prisma.staffProfile.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error("GET_STAFF_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ POST: Create a fresh specialist profile under this business
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, roleTitle, bio, specialtyCategories, email } =
      await request.json();

    if (!name || !roleTitle) {
      return NextResponse.json(
        { error: "Name and Title fields are required" },
        { status: 400 },
      );
    }

    const newStaff = await prisma.staffProfile.create({
      data: {
        businessId,
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        bio: bio || null,
        email: email || null,
        specialtyCategories: specialtyCategories || [],
        isActive: true,
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error("POST_STAFF_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
