// lib/actions/admin-impersonate.ts
"use server";

import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/admin";
import { logAdminAction } from "@/lib/actions/admin-audit";
import { prisma } from "@/lib/prisma";

const IMPERSONATION_COOKIE_NAME = "freshpoint_impersonator_ctx";

export interface ImpersonationState {
  isImpersonating: boolean;
  businessId: string | null;
  businessName: string | null;
  businessSlug: string | null;
  adminId: string | null;
}

/**
 * Initiates an active merchant impersonation session context for a verified admin.
 */
export async function startImpersonationAction(businessId: string) {
  const adminSession = await verifyAdminSession();

  if (!adminSession.isAdmin && !adminSession.isPlatformStaff) {
    throw new Error(
      "Unauthorized: Identity context lacks platform privileges.",
    );
  }

  const targetBusiness = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, slug: true },
  });

  if (!targetBusiness) {
    throw new Error("Target merchant business profile does not exist.");
  }

  const cookieStore = await cookies();
  const payload = JSON.stringify({
    businessId,
    businessName: targetBusiness.name,
    businessSlug: targetBusiness.slug,
    adminId: adminSession.userId,
  });

  // Mint cookie tracking variables
  cookieStore.set(IMPERSONATION_COOKIE_NAME, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2-hour window limit
  });

  await logAdminAction({
    action: `Started impersonation session for business: ${targetBusiness.name}`,
    targetType: "Vendor",
    targetId: businessId,
    targetLabel: targetBusiness.name,
    metadata: { adminActorId: adminSession.userId },
  });

  // 🌟 ROUTING FIX: Added trailing route mapping to drop straight into the dynamic shell subfolder index
  return { success: true, redirectUrl: `/business/${targetBusiness.slug}` };
}

/**
 * Destroys the active impersonation context and forces immediate admin panel redirection.
 */
export async function stopImpersonationAction() {
  const currentCtx = await getImpersonationContext();
  const cookieStore = await cookies();

  cookieStore.delete(IMPERSONATION_COOKIE_NAME);

  if (currentCtx.isImpersonating && currentCtx.businessId) {
    await logAdminAction({
      action: `Terminated impersonation session for business: ${currentCtx.businessName}`,
      targetType: "Vendor",
      targetId: currentCtx.businessId,
      targetLabel: currentCtx.businessName ?? undefined,
      metadata: { adminActorId: currentCtx.adminId },
    });
  }

  // 🌟 EXIT REDIRECT FIX: Forcing absolute navigation target return straight to the admin businesses directory
  return { success: true, redirectUrl: "/admin/businesses" };
}

/**
 * Evaluates active administrative session status profiles.
 */
export async function getImpersonationContext(): Promise<ImpersonationState> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE_NAME);

  if (!token?.value) {
    return {
      isImpersonating: false,
      businessId: null,
      businessName: null,
      businessSlug: null,
      adminId: null,
    };
  }

  try {
    const data = JSON.parse(token.value);
    return {
      isImpersonating: true,
      businessId: data.businessId,
      businessName: data.businessName,
      businessSlug: data.businessSlug,
      adminId: data.adminId,
    };
  } catch {
    return {
      isImpersonating: false,
      businessId: null,
      businessName: null,
      businessSlug: null,
      adminId: null,
    };
  }
}
