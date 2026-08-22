// lib/actions/admin-complaints.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";
import {
  ComplaintStatus,
  ComplaintSeverity,
  ComplaintCategory,
} from "@prisma/client";
import { logAdminAction } from "@/lib/actions/admin-audit";
import { syncBanStatusToClerk, revokeAllUserSessions } from "@/lib/clerk-sync";

export interface ComplaintData {
  id: string;
  summary: string;
  rawMessage: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  category: ComplaintCategory;
  orderCode: string | null;
  bookingId: string | null;
  createdAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    isBanned: boolean; // Map customer account ban state status
  };
  business: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export async function getAllPlatformComplaints(): Promise<ComplaintData[]> {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();
  if (!isAdmin && !isPlatformStaff) {
    throw new Error("Unauthorized access to administrative data pools.");
  }

  return await prisma.complaint.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isBanned: true,
        },
      },
      business: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateComplaintStatusAction(
  id: string,
  status: ComplaintStatus,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin, isPlatformStaff, adminRole } = await verifyAdminSession();
  const isAuthorizedOperator =
    isAdmin ||
    (isPlatformStaff &&
      (adminRole === "PLATFORM_MANAGER" || adminRole === "SUPPORT_AGENT"));

  if (!isAuthorizedOperator) {
    return {
      success: false,
      message: "You do not have permission to change this ticket status.",
    };
  }

  try {
    await prisma.complaint.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });

    await logAdminAction({
      action: "UPDATE_COMPLAINT_STATUS",
      targetType: "Complaint",
      targetId: id,
      metadata: { newStatus: status },
    });

    revalidatePath("/admin/complaints");
    return { success: true, message: "Ticket status successfully updated." };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database Error";
    return {
      success: false,
      message: `Failed to update ticket parameters: ${errorMsg}`,
    };
  }
}

/**
 * THE SYSTEM ACCESS BAN MUTATION
 * Bans a User (Customer/Client).
 * Automatically shifts their Business visibility status dynamically to protect client operations.
 */
export async function toggleCustomerBanAction(
  userId: string,
  banState: boolean,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return {
      success: false,
      message: "You do not have permission to change account access status.",
    };
  }

  try {
    // 1. Mutate the main user object record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: banState },
      select: { clerkId: true },
    });

    // 2. Sync the ban flag into Clerk's JWT so middleware can enforce it
    await syncBanStatusToClerk(updatedUser.clerkId, banState);

    // 3. If banning (not unbanning), kill every active session right now
    if (banState) {
      await revokeAllUserSessions(updatedUser.clerkId);
    }

    // 4. Cascade down: Freeze or un-freeze any stores owned by this explicit user identity matching ownerId
     await prisma.business.updateMany({
       where: { ownerId: userId },
       data: banState
         ? { isActive: false, status: "suspended" }
         : { isActive: true, status: "approved" },
     });

     await logAdminAction({
       action: banState ? "BAN_USER" : "UNBAN_USER",
       targetType: "User",
       targetId: userId,
       metadata: { businessesCascaded: true },
     });

    revalidatePath("/admin/complaints");
    revalidatePath("/admin/businesses");

    return {
      success: true,
      message: banState
        ? "Customer account blocked successfully. All stores owned by this profile have been closed down too."
        : "Customer account restored successfully. Their stores have been safely reopened.",
    };
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database connection issue";
    return {
      success: false,
      message: `Could not modify system safety parameters: ${errorMsg}`,
    };
  }
}
