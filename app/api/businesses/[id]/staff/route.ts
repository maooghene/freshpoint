import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Next.js 15: Explicitly await your route context params array packages
    const { id: businessId } = await params;
    const { email, name, role } = await req.json();

    // 1. Authorization: Verify the caller owns this particular business
    const business = await prisma.business.findFirst({
      where: { id: businessId, owner: { clerkId: userId } },
    });
    if (!business)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2️⃣ 🛠️ CRITICAL CLERK V5+ REPAIR: Corrected invocation to stop backend runtime failures
    const clerk = await clerkClient();
    await clerk.invitations.createInvitation({
      emailAddress: email.toLowerCase(),
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`,
      ignoreExisting: true,
    });

    // 3. Database Sync: Provision a pending staff profile record under this tenant
    const newStaff = await prisma.staffProfile.create({
      data: {
        businessId: business.id,
        name: name,
        role: role,
        email: email.toLowerCase(),
        // Matches your schema property default values safely
        isActive: false,
      },
    });

    return NextResponse.json(
      { success: true, staff: newStaff },
      { status: 201 },
    );
  } catch (error) {
    console.error("Staff addition pipeline error:", error);
    return NextResponse.json(
      { error: "Internal server processing failure" },
      { status: 500 },
    );
  }
}
