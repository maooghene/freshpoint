// app/api/business/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, businessId } = await req.json();

    if (!name || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const authorized = await authorizeBusinessAccess({
      businessId: business.id,
      ownerId: business.ownerId,
      systemUserId: dbUser.id,
      allowStaff: false,
    });

    if (!authorized) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }
    const staff = await prisma.staffProfile.create({
      data: {
        name: name.trim(),
        // include required email field and connect to business relation
        email: "",
        business: { connect: { id: businessId } },
        isActive: true,
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error("STAFF_CREATE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
