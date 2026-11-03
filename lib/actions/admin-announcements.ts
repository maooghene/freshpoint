"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";
import { z } from "zod";
import { idSchema, text } from "@/lib/validation";
import { UserRole } from "@prisma/client";

const announcementFormSchema = z
  .object({
    title: text(100, 3).describe("Title"),
    message: text(1000, 5),
    severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
    targetType: z.enum(["ALL", "ROLE", "BUSINESS"]),
    targetRole: z.nativeEnum(UserRole).optional(),
    targetBusinessId: idSchema.optional(),
    endsAt: z.coerce
      .date({ message: "Enter a valid end date." })
      .refine((d) => d.getTime() > Date.now(), "End date must be in the future.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.targetType === "ROLE" && !value.targetRole) {
      ctx.addIssue({ code: "custom", path: ["targetRole"], message: "Select a role to target." });
    }
    if (value.targetType === "BUSINESS" && !value.targetBusinessId) {
      ctx.addIssue({ code: "custom", path: ["targetBusinessId"], message: "Select a business to target." });
    }
  });

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

  const parsed = announcementFormSchema.safeParse({
    title: formData.get("title")?.toString(),
    message: formData.get("message")?.toString(),
    severity: formData.get("severity")?.toString() || "INFO",
    targetType: formData.get("targetType")?.toString() || "ALL",
    targetRole: formData.get("targetRole")?.toString() || undefined,
    targetBusinessId: formData.get("targetBusinessId")?.toString() || undefined,
    endsAt: formData.get("endsAt")?.toString() || undefined,
  });

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "message");
      (errors[key] ??= []).push(issue.message);
    }
    return { success: false, message: "Validation failed.", errors };
  }

  const { title, message, severity, targetType, targetRole, targetBusinessId, endsAt } =
    parsed.data;

  await prisma.announcement.create({
    data: {
      title,
      message,
      severity,
      targetType,
      targetRole: targetType === "ROLE" ? targetRole : null,
      targetBusinessId: targetType === "BUSINESS" ? targetBusinessId : null,
      endsAt: endsAt ?? null,
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
  if (!idSchema.safeParse(id).success) throw new Error("Invalid announcement.");

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
  if (!idSchema.safeParse(id).success) throw new Error("Invalid announcement.");

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
