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

/**
 * Records an admin action to the audit trail. Call this from inside any
 * server action that mutates platform data on an admin's behalf.
 * Never throws — a logging failure should never block the actual action.
 */
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
        targetLabel,
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
