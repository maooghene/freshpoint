import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { userId: requesterClerkId } = getAuth(request);
    if (!requesterClerkId)
      return NextResponse.json("Unauthorized", { status: 401 });

    // Ensure only an existing ADMIN can elevate another user's privileges
    const isSuperAdmin = await authAdmin(requesterClerkId);
    if (!isSuperAdmin) return NextResponse.json("Forbidden", { status: 403 });

    const { targetUserId } = await request.json(); // Expects the internal model User.id

    const elevatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: UserRole.ADMIN },
    });

    return NextResponse.json({
      success: true,
      message: `${elevatedUser.email} promoted to ADMIN successfully.`,
    });
  } catch (error) {
    console.error("PROMOTIONS_ERROR:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
