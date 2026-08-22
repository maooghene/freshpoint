// lib/actions/admin-business-detail.ts
"use server";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";

export interface BusinessDetailData {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  sittingCapacity: number;
  categories: string[];
  description: string | null;
  image: string | null;
  status: string;
  isActive: boolean;
  isPayoutFrozen: boolean;
  baseDeliveryFee: number;
  deliveryFeePerKm: number;
  createdAt: Date;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    staff: number;
    bookings: number;
    orders: number;
    complaints: number;
  };
  recentBookings: Array<{
    id: string;
    startTime: Date;
    totalAmount: number | null;
    status: string;
    user: { firstName: string | null; lastName: string | null; email: string };
  }>;
  recentOrders: Array<{
    id: string;
    code: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    user: { firstName: string | null; lastName: string | null; email: string };
  }>;
  complaints: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    user: { firstName: string | null; lastName: string | null };
  }>;
  auditLogs: Array<{
    id: string;
    actorName: string;
    action: string;
    createdAt: Date;
    metadata: any;
  }>;
}

export async function getBusinessDetail(
  businessId: string,
): Promise<BusinessDetailData | null> {
  const adminSession = await verifyAdminSession();

  if (!adminSession.isAdmin && !adminSession.isPlatformStaff) {
    throw new Error("Unauthorized access to platform administration.");
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          staff: true,
          bookings: true,
          orders: true,
          complaints: true,
        },
      },
      bookings: {
        take: 5,
        orderBy: { startTime: "desc" },
        select: {
          id: true,
          startTime: true,
          totalAmount: true,
          status: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
      complaints: {
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          summary: true,
          rawMessage: true,
          category: true,
          severity: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!business) return null;

  // Querying audit logs with strict fallback to "Vendor" targetType mapping
  const auditLogs = await prisma.auditLogEntry.findMany({
    where: {
      targetType: "Vendor",
      targetId: businessId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      actorName: true,
      action: true,
      createdAt: true,
      metadata: true,
    },
  });

  return {
    ...business,
    status: business.status,
    recentBookings: business.bookings,
    recentOrders: business.orders,
    complaints: business.complaints.map((c) => ({
      id: c.id,
      title: c.summary,
      description: c.rawMessage ?? "",
      status: String(c.status),
      createdAt: c.createdAt,
      user: c.user,
    })),
    auditLogs: auditLogs,
  };
}
