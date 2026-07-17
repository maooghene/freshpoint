import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ destination: "/register-business" });
    }

    const exitCookie = request.cookies.get("freshpoint_exit_clearance")?.value;

    if (exitCookie === "true") {
      return NextResponse.json(
        { destination: null },
        {
          headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        },
      );
    }

    const clerkUser = await currentUser();
    const emailAddress =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";

    if (!emailAddress) {
      return NextResponse.json({ destination: "/register-business" });
    }

    const { isAdmin, isPlatformStaff } = await verifyAdminSession();
    const isAdminUser = isAdmin || isPlatformStaff;

    const systemUser = await prisma.user.upsert({
      where: { email: emailAddress },
      update: { clerkId: userId },
      create: {
        clerkId: userId,
        email: emailAddress,
        firstName: clerkUser?.firstName || "Valued",
        lastName: clerkUser?.lastName || "Guest",
        role: "CUSTOMER",
      },
    });

    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: systemUser.id },
      select: { slug: true, status: true, isActive: true },
    });

    const activeStaffWorkspace = await prisma.staffProfile.findFirst({
      where: { email: emailAddress, isActive: true },
      select: { id: true, business: { select: { slug: true } } },
    });

    const isBusinessOwner = !!(existingBusiness && existingBusiness.slug);
    const isStaffMember = !!(
      activeStaffWorkspace && activeStaffWorkspace.business?.slug
    );

    const identityCount = [isAdminUser, isBusinessOwner, isStaffMember].filter(
      Boolean,
    ).length;

    // ✅ FIX: Injected metadata markers explicitly so select-workspace view resolves links correctly
    if (identityCount >= 2) {
      return NextResponse.json(
        {
          destination: "/select-workspace",
          isAdmin: isAdminUser,
          isBusinessOwner,
          isStaffMember,
          businessSlug: existingBusiness?.slug || null,
          staffBusinessSlug: activeStaffWorkspace?.business?.slug || null,
        },
        {
          headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        },
      );
    }

    if (isAdminUser) {
      return NextResponse.json({ destination: "/admin" });
    }

    if (isBusinessOwner && existingBusiness) {
      return existingBusiness.status === "approved" && existingBusiness.isActive
        ? NextResponse.json({
            destination: `/business/${existingBusiness.slug}`,
          })
        : NextResponse.json({ destination: "/register-business" });
    }

    return NextResponse.json({ destination: "/" });
  } catch (error: unknown) {
    console.error("ONBOARDING_CHECK_ERROR:", error);
    return NextResponse.json({ destination: "/" }, { status: 500 });
  }
}
