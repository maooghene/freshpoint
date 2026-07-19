// lib/actions/admin-audit.ts
"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";

interface LogAdminActionParams {
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}

// Resolves a human-readable name for the target when the caller didn't supply one.
async function resolveTargetLabel(
  targetType: string,
  targetId: string,
): Promise<string> {
  try {
    switch (targetType.toLowerCase()) {
      case "user": {
        const u = await prisma.user.findUnique({
          where: { id: targetId },
          select: { firstName: true, lastName: true, email: true },
        });
        return (
          `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() ||
          u?.email ||
          targetId
        );
      }
      case "vendor":
      case "business": {
        const b = await prisma.business.findUnique({
          where: { id: targetId },
          select: { name: true },
        });
        return b?.name || targetId;
      }
      case "businesscategory": {
        const c = await prisma.businessCategory.findUnique({
          where: { id: targetId },
          select: { label: true },
        });
        return c?.label || targetId;
      }
      case "itemcategory": {
        const c = await prisma.itemCategory.findUnique({
          where: { id: targetId },
          select: { name: true },
        });
        return c?.name || targetId;
      }
      default:
        return targetId;
    }
  } catch {
    return targetId;
  }
}

export async function logAdminAction({
  action,
  targetType,
  targetId,
  targetLabel,
  metadata,
}: LogAdminActionParams): Promise<void> {
  try {
    const { userId, clerkId } = await verifyAdminSession();
    if (!userId) return;

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    const resolvedLabel =
      targetLabel ?? (await resolveTargetLabel(targetType, targetId));

    await prisma.auditLogEntry.create({
      data: {
        actorId: userId,
        actorName:
          `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim() ||
          actor?.email ||
          clerkId ||
          "Unknown Admin",
        action,
        targetType,
        targetId,
        targetLabel: resolvedLabel,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (err) {
    console.error("AUDIT_LOG_FAILURE:", err);
  }
}

export interface AuditLogRow {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  metadata: unknown;
  createdAt: Date;
}

export async function getAuditLog(limit = 100): Promise<AuditLogRow[]> {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();
  if (!isAdmin && !isPlatformStaff) {
    throw new Error("Unauthorized access to administrative data pools.");
  }

  return await prisma.auditLogEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
