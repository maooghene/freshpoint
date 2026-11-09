import { z } from "zod";
import { parseJsonBody, idSchema } from "@/lib/validation";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import { logAdminAction } from "@/lib/actions/admin-audit";
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

    const parsed = await parseJsonBody(
      request,
      z.object({ targetUserId: idSchema }), // internal model User.id
    );
    if (!parsed.ok) return parsed.response;
    const { targetUserId } = parsed.data;

    const elevatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: UserRole.ADMIN },
    });

    // Granting admin is the most powerful change there is, so it is recorded.
    await logAdminAction({
      action: "PROMOTE_USER_TO_ADMIN",
      targetType: "User",
      targetId: targetUserId,
      targetLabel: elevatedUser.email,
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
