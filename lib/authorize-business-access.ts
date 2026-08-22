// lib/authorize-business-access.ts
import { prisma } from "@/lib/prisma";
import { getImpersonationContext } from "@/lib/actions/admin-impersonate";
import { verifyAdminSession } from "@/lib/admin";

interface AuthorizeBusinessAccessParams {
  businessId: string;
  ownerId: string;
  systemUserId: string;
  allowStaff?: boolean; // defaults to true
}

export async function authorizeBusinessAccess({
  businessId,
  ownerId,
  systemUserId,
  allowStaff = true,
}: AuthorizeBusinessAccessParams): Promise<boolean> {
  // 1. Real owner
  if (ownerId === systemUserId) return true;

  // 2. Real rostered staff (only when this surface permits staff access)
  if (allowStaff) {
    const isRosteredStaff = await prisma.staffProfile.findFirst({
      where: {
        userId: systemUserId,
        businessId,
        isActive: true,
      },
      select: { id: true },
    });
    if (isRosteredStaff) return true;
  }

  // 3. Verified admin impersonation session scoped to this exact business
  const impersonation = await getImpersonationContext();
  if (
    impersonation.isImpersonating &&
    impersonation.businessId === businessId
  ) {
    const adminSession = await verifyAdminSession();
    if (adminSession.isAdmin || adminSession.isPlatformStaff) {
      return true;
    }
  }

  return false;
}
