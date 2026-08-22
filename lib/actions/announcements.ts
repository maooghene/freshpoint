"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export interface ActiveAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

/**
 * Returns active, currently-in-window, non-dismissed announcements
 * targeted at the current user — either globally, by their role, or
 * scoped to a specific business (when businessId is provided, e.g.
 * while viewing a business dashboard).
 */
export async function getActiveAnnouncementsForUser(
  businessId?: string,
): Promise<ActiveAnnouncement[]> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  const systemUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  });

  if (!systemUser) return [];

  const now = new Date();

  const targetConditions: object[] = [
    { targetType: "ALL" },
    { targetType: "ROLE", targetRole: systemUser.role },
  ];

  if (businessId) {
    targetConditions.push({
      targetType: "BUSINESS",
      targetBusinessId: businessId,
    });
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      AND: [{ OR: targetConditions }],
      dismissals: {
        none: { userId: systemUser.id },
      },
    },
    select: {
      id: true,
      title: true,
      message: true,
      severity: true,
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
  });

  return announcements as ActiveAnnouncement[];
}

export async function dismissAnnouncementAction(announcementId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false };

  const systemUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!systemUser) return { success: false };

  await prisma.announcementDismissal.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId: systemUser.id,
      },
    },
    create: { announcementId, userId: systemUser.id },
    update: {},
  });

  return { success: true };
}
