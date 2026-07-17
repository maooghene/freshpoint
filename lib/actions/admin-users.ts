// lib/actions/admin-users.ts
"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";

export interface OwnedBusinessSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
}

export interface PlatformUserRow {
  id: string;
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  isBanned: boolean;
  role: string;
  createdAt: Date;
  _count: {
    bookings: number;
    orders: number;
  };
  businesses: OwnedBusinessSummary[];
}

export async function searchPlatformUsers(
  query: string,
): Promise<PlatformUserRow[]> {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();
  if (!isAdmin && !isPlatformStaff) {
    throw new Error("Unauthorized access to administrative data pools.");
  }

  const trimmed = query.trim();

  return await prisma.user.findMany({
    where: trimmed
      ? {
          OR: [
            { email: { contains: trimmed, mode: "insensitive" } },
            { firstName: { contains: trimmed, mode: "insensitive" } },
            { lastName: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      clerkId: true,
      firstName: true,
      lastName: true,
      email: true,
      isBanned: true,
      role: true,
      createdAt: true,
      _count: {
        select: { bookings: true, orders: true },
      },
      businesses: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
