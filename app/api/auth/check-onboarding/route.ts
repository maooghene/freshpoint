import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    // 1. If not authenticated, prompt back to standard registration fallback entry point
    if (!userId) {
      return NextResponse.json({ destination: "/register-business" });
    }

    const clerkUser = await currentUser();
    const emailAddress =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";

    if (!emailAddress) {
      return NextResponse.json({ destination: "/register-business" });
    }

    // 0. PRIORITY 0: PLATFORM ADMIN INTERCEPT
    // Admins and platform staff always land in the control center, regardless
    // of whether they also happen to own or work at a business.
    const { isAdmin, isPlatformStaff } = await verifyAdminSession();
    if (isAdmin || isPlatformStaff) {
      return NextResponse.json({ destination: "/admin" });
    }

    // Resolve or sync basic account data profile matrices safely
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

    /* =========================================================================
       🎯 RELATIONAL CONTEXT DIGESTION PHASE
       Pre-fetch and evaluate all potential organizational structural links 
       bound to this unified system account profile.
       ========================================================================= */

    // Check if this user owns a business store setup
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: systemUser.id },
      select: { slug: true, status: true, isActive: true },
    });

    // Check if they have an active working staff profile record linked to an email roster
    const activeStaffWorkspace = await prisma.staffProfile.findFirst({
      where: {
        email: emailAddress,
        isActive: true,
      },
      select: {
        id: true,
        business: { select: { slug: true } },
      },
    });

    const isBusinessOwner = !!(existingBusiness && existingBusiness.slug);
    const isStaffMember = !!(
      activeStaffWorkspace && activeStaffWorkspace.business?.slug
    );

    /* =========================================================================
       🔀 PRIORITY 0: MULTI-IDENTITY CROSSROADS INTERCEPT
       If the user account owns a storefront AND is an active employee inside 
       a distinct multi-tenant matrix, send them to the workspace portal chooser.
       ========================================================================= */
    if (isBusinessOwner && isStaffMember) {
      return NextResponse.json({ destination: "/workspace-selector" });
    }

    /* =========================================================================
       👑 PRIORITY 1: SINGLE-TRACK MERCHANT BUSINESS OWNER CHECK
       If this account owns a store, they must ALWAYS go to their manager dashboard.
       This breaks the loop and stops business owners from getting stuck in staff checks.
       ========================================================================= */
    if (isBusinessOwner && existingBusiness) {
      // 🌟 AUTOMATED VETTING VERIFICATION RECONCILIATION:
      // If approved, push to live dashboard link. If rejected, route back to form layout!
      if (existingBusiness.status === "approved" && existingBusiness.isActive) {
        return NextResponse.json({
          destination: `/business/${existingBusiness.slug}`,
        });
      } else {
        return NextResponse.json({
          destination: "/register-business",
        });
      }
    }

    /* =========================================================================
       🎯 PRIORITY 2: UNCLAIMED STAFF INVITATION TOKEN MATCH
       If they don't own a business, check if they have a pending invite token 
       matching their email. If found, link it atomically right now.
       ========================================================================= */
    const pendingInvitation = await prisma.staffProfile.findFirst({
      where: {
        email: emailAddress,
        userId: null,
      },
    });

    if (pendingInvitation) {
      await prisma.staffProfile.update({
        where: { id: pendingInvitation.id },
        data: {
          userId: systemUser.id,
          isActive: true,
          name: `${systemUser.firstName} ${systemUser.lastName}`.trim(),
        },
      });

      // Update local role tag; if they subsequently create a business,
      // the Priority 0 interceptor handles the role selection selector.
      await prisma.user.update({
        where: { id: systemUser.id },
        data: { role: "STAFF" },
      });

      const assignedStore = await prisma.business.findUnique({
        where: { id: pendingInvitation.businessId },
        select: { slug: true },
      });

      return NextResponse.json({
        destination: assignedStore?.slug
          ? `/business/${assignedStore.slug}`
          : "/staff/dashboard",
      });
    }

    /* =========================================================================
       💼 PRIORITY 3: ESTABLISHED WORKING TEAM PROFILE CHECK
       Only route them to the staff dashboard if they have a staff profile record 
       AND it is verified as active (isActive: true).
       ========================================================================= */
    if (isStaffMember && activeStaffWorkspace.business) {
      return NextResponse.json({
        destination: `/business/${activeStaffWorkspace.business.slug}`,
      });
    }

    /* =========================================================================
       🛒 PRIORITY 4: STANDARD CUSTOMER FALLBACK
       If they aren't a business owner, have no pending invites, and aren't an 
       active staff member, they are a normal client. Send them to the homepage cleanly!
       ========================================================================= */
    return NextResponse.json({ destination: "/" });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Fatal onboarding check error";
    console.error("ONBOARDING_CHECK_ERROR:", errorMsg);
    return NextResponse.json({ destination: "/" }, { status: 500 });
  }
}
