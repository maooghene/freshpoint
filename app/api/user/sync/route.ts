import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 import instance
import { UserRole } from "@prisma/client"; // Clean enum matching your schema

export async function POST(request: NextRequest) {
  console.log("[SYNC_USER] Synchronizing profile hooks...");

  try {
    const body = await request.json();
    const { clerkId, email, firstName, lastName, image } = body;

    if (!clerkId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: clerkId, email" },
        { status: 400 },
      );
    }

    // ✅ UPSERT: Safe cross-platform account compilation
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        image: image ?? undefined,
        // Role is securely preserved to prevent privilege injection
      },
      create: {
        clerkId,
        email,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        image: image ?? "",
        role: UserRole.CUSTOMER, // Type-safe initialization mapping
      },
    });

    console.log("USER SYNCHRONIZED ROLE:", user.role);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("[SYNC_USER_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
