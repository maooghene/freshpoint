// lib/admin.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole, PlatformAdminRole } from "@prisma/client";

interface ClerkCustomMetadata {
  role?: UserRole;
}

interface AdminSessionResponse {
  isAdmin: boolean; // True if role is ADMIN
  isPlatformStaff: boolean; // True if role is STAFF and has a custom profile
  adminRole?: PlatformAdminRole;
  userId?: string;
  clerkId?: string;
}

/**
 * Access gate that validates session credentials across layouts, components, and server actions.
 * Evaluates Clerk JWT publicMetadata tokens first before checking fine-grained database properties.
 */
export async function verifyAdminSession(): Promise<AdminSessionResponse> {
  const { userId: clerkId, sessionClaims } = await auth();

  if (!clerkId) {
    return { isAdmin: false, isPlatformStaff: false };
  }

  // 1. Fast Path: Process global platform ADMIN status from the session token
  const metadata = sessionClaims?.metadata as ClerkCustomMetadata | undefined;
  if (metadata?.role === UserRole.ADMIN) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    return { isAdmin: true, isPlatformStaff: false, userId: user?.id, clerkId };
  }

  // 2. Comprehensive Path: Check direct database properties to evaluate operational Staff permissions
  const directLookup = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      role: true,
      platformAdminProfile: {
        select: { adminRole: true, isActive: true },
      },
    },
  });

  if (directLookup?.role === UserRole.ADMIN) {
    return {
      isAdmin: true,
      isPlatformStaff: false,
      userId: directLookup.id,
      clerkId,
    };
  }

  // Verify the platform admin profile is active before granting access
  if (
    directLookup?.role === UserRole.STAFF &&
    directLookup.platformAdminProfile?.isActive
  ) {
    return {
      isAdmin: false,
      isPlatformStaff: true,
      adminRole: directLookup.platformAdminProfile.adminRole,
      userId: directLookup.id,
      clerkId,
    };
  }

  return { isAdmin: false, isPlatformStaff: false, clerkId };
}

/**
 * Procedural gate to assert staff-level role permissions inside code blocks.
 * Full platform admins automatically pass all granular staff role validation gates.
 */
export async function enforceStaffPermissionGate(
  allowedRoles: PlatformAdminRole[],
): Promise<AdminSessionResponse> {
  const session = await verifyAdminSession();

  if (session.isAdmin) {
    return session;
  }

  if (
    session.isPlatformStaff &&
    session.adminRole &&
    allowedRoles.includes(session.adminRole)
  ) {
    return session;
  }

  throw new Error(
    "Access Denied. Your profile context lacks permission mappings for this operation.",
  );
}
