// lib/actions/admin-analytics.ts
"use server";

import { prisma } from "@/lib/prisma";
import { ComplaintStatus } from "@prisma/client";
import { computeTimelineData } from "@/lib/dashboard-helpers";

export interface ChartPoint {
  period: string;
  Revenue: number;
  Bookings: number;
  Orders: number;
}

interface TrendPoint {
  period: string;
  value: number;
}

export interface DashboardMetrics {
  totalGrossRevenue: number;
  platformCommissionsGross: number;
  totalBusinesses: number;
  pendingBusinesses: number;
  activeComplaintsCount: number;
  aggregateOrderGross: number;
  aggregateDeliveryGross: number;
  aggregateBookingGross: number;
  totalVolumeCount: number;
  chartData: ChartPoint[];
  revenueSparkline: number[];
  vendorSparkline: number[];
  complaintsSparkline: number[];
}

const monthsKey = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function computeMonthlyCounts(dates: Date[]): TrendPoint[] {
  const map: Record<string, TrendPoint> = {};
  const currentMonthIdx = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
    const label = monthsKey[targetMonthIdx];
    map[label] = { period: label, value: 0 };
  }
  dates.forEach((d) => {
    const label = monthsKey[new Date(d).getMonth()];
    if (map[label]) map[label].value += 1;
  });
  return Object.values(map);
}

export async function getPlatformAnalyticsMetrics(): Promise<DashboardMetrics> {
  const [
    totalBusinesses,
    pendingBusinesses,
    ordersMetrics,
    bookingsMetrics,
    complaintsMetrics,
    bookingRows,
    orderRows,
    businessRows,
    complaintRows,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "pending" } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true, deliveryFee: true },
      _count: { id: true },
    }),
    prisma.booking.aggregate({
      _sum: { totalAmount: true, freshpointNet: true },
      _count: { id: true },
    }),
    prisma.complaint.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.booking.findMany({
      select: { createdAt: true, status: true, totalAmount: true },
    }),
    prisma.order.findMany({
      select: { createdAt: true, status: true, totalAmount: true },
    }),
    prisma.business.findMany({
      select: { createdAt: true },
    }),
    prisma.complaint.findMany({
      select: { createdAt: true },
    }),
  ]);

  const aggregateOrderGross = ordersMetrics._sum.totalAmount ?? 0;
  const aggregateDeliveryGross = ordersMetrics._sum.deliveryFee ?? 0;
  const aggregateBookingGross = bookingsMetrics._sum.totalAmount ?? 0;
  const platformCommissionsGross = bookingsMetrics._sum.freshpointNet ?? 0;
  const totalGrossRevenue = aggregateOrderGross + aggregateBookingGross;
  const totalVolumeCount =
    (ordersMetrics._count.id ?? 0) + (bookingsMetrics._count.id ?? 0);

  const activeComplaintsCount = complaintsMetrics
    .filter(
      (c) =>
        c.status === ComplaintStatus.OPEN ||
        c.status === ComplaintStatus.IN_PROGRESS,
    )
    .reduce((acc, curr) => acc + curr._count.id, 0);

  const chartData = computeTimelineData(bookingRows, orderRows);
  const vendorTrend = computeMonthlyCounts(
    businessRows.map((b) => b.createdAt),
  );
  const complaintsTrend = computeMonthlyCounts(
    complaintRows.map((c) => c.createdAt),
  );

  return {
    totalGrossRevenue,
    platformCommissionsGross,
    totalBusinesses,
    pendingBusinesses,
    activeComplaintsCount,
    aggregateOrderGross,
    aggregateDeliveryGross,
    aggregateBookingGross,
    totalVolumeCount,
    chartData,
    revenueSparkline: chartData.map((d) => d.Revenue),
    vendorSparkline: vendorTrend.map((d) => d.value),
    complaintsSparkline: complaintsTrend.map((d) => d.value),
  };
}
