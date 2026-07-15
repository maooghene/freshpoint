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
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  business: {
    name: string;
    slug: string;
  } | null;
}

/**
 * Fetches all platform complaints sorted by creation date.
 */
export async function getAllPlatformComplaints(): Promise<ComplaintData[]> {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();

  // Grant data access to full global admins or any active platform operators
  if (!isAdmin && !isPlatformStaff) {
    throw new Error("Unauthorized access to administrative data pools.");
  }

  return await prisma.complaint.findMany({
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
      business: {
        select: { name: true, slug: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Updates a complaint's structural handling parameters.
 */
export async function updateComplaintStatusAction(
  id: string,
  status: ComplaintStatus,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin, isPlatformStaff, adminRole } = await verifyAdminSession();

  // Guardrail: Restrict status adjustments to global admins, managers, or dedicated support agents
  const isAuthorizedOperator =
    isAdmin ||
    (isPlatformStaff &&
      (adminRole === "PLATFORM_MANAGER" || adminRole === "SUPPORT_AGENT"));

  if (!isAuthorizedOperator) {
    return {
      success: false,
      message:
        "Unauthorized access allocation. Proper operational permissions required.",
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

    revalidatePath("/admin/complaints");
    return { success: true, message: `Ticket status set to ${status}.` };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database Error";
    return {
      success: false,
      message: `Failed to update ticket parameters: ${errorMsg}`,
    };
  }
}
