"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";

export interface AnnouncementActionState {
  success: boolean;
  message: string;
  errors?: {
    title?: string[];
    message?: string[];
    targetRole?: string[];
    targetBusinessId?: string[];
  };
}

export async function createAnnouncementAction(
  prevState: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const session = await verifyAdminSession();
  if (!session.isAdmin && !session.isPlatformStaff) {
    return { success: false, message: "Unauthorized." };
  }

  const title = formData.get("title")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";
  const severity = (formData.get("severity")?.toString() || "INFO") as
    | "INFO"
    | "WARNING"
    | "CRITICAL";
  const targetType = (formData.get("targetType")?.toString() || "ALL") as
    | "ALL"
    | "ROLE"
    | "BUSINESS";
  const targetRole = formData.get("targetRole")?.toString() || null;
  const targetBusinessId = formData.get("targetBusinessId")?.toString() || null;
  const endsAtRaw = formData.get("endsAt")?.toString();

  const errors: Record<string, string[]> = {};
  if (!title || title.length < 3)
    errors.title = ["Title must be at least 3 characters."];
  if (!message || message.length < 5)
    errors.message = ["Message must be at least 5 characters."];
  if (targetType === "ROLE" && !targetRole) {
    errors.targetRole = ["Select a role to target."];
  }
  if (targetType === "BUSINESS" && !targetBusinessId) {
    errors.targetBusinessId = ["Select a business to target."];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors };
  }

  await prisma.announcement.create({
    data: {
      title,
      message,
      severity,
      targetType,
      targetRole: targetType === "ROLE" ? (targetRole as any) : null,
      targetBusinessId: targetType === "BUSINESS" ? targetBusinessId : null,
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      createdById: session.userId!,
    },
  });

  revalidatePath("/admin/announcements");
  return { success: true, message: "Announcement published." };
}

export async function toggleAnnouncementActiveAction(id: string) {
  const session = await verifyAdminSession();
  if (!session.isAdmin && !session.isPlatformStaff) {
    throw new Error("Unauthorized.");
  }

  const current = await prisma.announcement.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) throw new Error("Announcement not found.");

  await prisma.announcement.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncementAction(id: string) {
  const session = await verifyAdminSession();
  if (!session.isAdmin && !session.isPlatformStaff) {
    throw new Error("Unauthorized.");
  }

  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/admin/announcements");
}

export async function listAnnouncementsForAdmin() {
  const session = await verifyAdminSession();
  if (!session.isAdmin && !session.isPlatformStaff) {
    throw new Error("Unauthorized.");
  }

  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      targetBusiness: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { dismissals: true } },
    },
  });
}
