import * as React from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus, OrderStatus } from "@prisma/client";
import { computeTimelineData, mergeActivities } from "@/lib/dashboard-helpers";
import { MetricsGrid } from "@/components/business/dashboard/MetricsGrid";
import PerformanceCharts from "./PerformanceCharts";
import RecentActivityFeed from "./RecentActivityFeed";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) notFound();

  // 1️⃣ SCOPE VARIABLES OUTSIDE: Isolate your data layer parameters from your JSX tree
  let business;
  let latestBookings = [];
  let latestOrders = [];

  try {
    business = await prisma.business.findFirst({
      where: { slug },
      include: {
        staff: { where: { isActive: true }, select: { id: true } },
        items: { where: { isActive: true }, select: { id: true, type: true } },
        bookings: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!business) notFound();

    [latestBookings, latestOrders] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId: business.id },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.order.findMany({
        where: { businessId: business.id },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);
  } catch (error) {
    console.error("Dashboard database fetch failure:", error);
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            We could not reach your workspace data right now.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh in a moment or try again later.
          </p>
        </div>
      </div>
    );
  }

  // 2️⃣ METRIC COMPUTATIONS: Process data calculations safely outside try/catch boundaries
  const totalServicesCount = business.items.filter(
    (i) => i.type === "SERVICE",
  ).length;
  const totalProductsCount = business.items.filter(
    (i) => i.type === "PRODUCT",
  ).length;
  const totalStaffCount = business.staff.length;

  const bookingRevenue = business.bookings
    .filter((b) => b.status === BookingStatus.COMPLETED)
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const orderRevenue = business.orders
    .filter((o) => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const formattedRevenue = `₦${(bookingRevenue + orderRevenue).toLocaleString()}`;

  const activeBookingsCount = business.bookings.filter(
    (b) =>
      b.status === BookingStatus.CONFIRMED ||
      b.status === BookingStatus.PENDING,
  ).length;

  const activeOrdersCount = business.orders.filter(
    (o) =>
      o.status === OrderStatus.PENDING ||
      o.status === OrderStatus.PROCESSING ||
      o.status === OrderStatus.SHIPPED,
  ).length;

  const performanceTimelineData = computeTimelineData(
    business.bookings,
    business.orders,
  );
  const unifiedActivities = mergeActivities(latestBookings, latestOrders);

  // 3️⃣ UNBLOCKED CLEAN JSX RETURN: No try/catch boundaries wrapping this layout tree
  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto min-w-0">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground truncate">
          Workspace Overview
        </h1>
        <p className="text-muted-foreground text-sm font-medium truncate">
          Monitor real-time analytics indicators, revenue yields, and active
          staff.
        </p>
      </div>

      <MetricsGrid
        formattedRevenue={formattedRevenue}
        activeBookingsCount={activeBookingsCount}
        activeOrdersCount={activeOrdersCount}
        totalStaffCount={totalStaffCount}
        totalServicesCount={totalServicesCount}
        totalProductsCount={totalProductsCount}
      />

      <div className="w-full min-w-0">
        <PerformanceCharts data={performanceTimelineData} />
      </div>
      <div className="w-full min-w-0">
        <RecentActivityFeed activities={unifiedActivities} />
      </div>
    </div>
  );
}
