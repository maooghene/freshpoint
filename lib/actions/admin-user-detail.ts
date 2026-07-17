// lib/actions/admin-user-detail.ts
"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";

export async function getUserDetail(userId: string) {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();
  if (!isAdmin && !isPlatformStaff) {
    throw new Error("Unauthorized access to administrative data pools.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isBanned: true,
      createdAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isActive: true,
          isPayoutFrozen: true,
        },
      },
      bookings: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          startTime: true,
          createdAt: true,
          business: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      orders: {
        select: {
          id: true,
          code: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          business: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      complaints: {
        select: {
          id: true,
          summary: true,
          status: true,
          severity: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) return null;

  const auditEntries = await prisma.auditLogEntry.findMany({
    where: { targetType: "User", targetId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { user, auditEntries };
}
