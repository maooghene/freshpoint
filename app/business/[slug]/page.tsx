import * as React from "react";
import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { computeTimelineData, mergeActivities } from "@/lib/dashboard-helpers";
import PerformanceCharts from "./PerformanceCharts";
import RecentActivityFeed from "./RecentActivityFeed";
import DashboardHeader from "./DashboardHeader";
import DashboardMetricsWrapper from "./DashboardMetricsWrapper";
import {
  PageProps,
  FullDashboardBusinessData,
  RichBookingTimelineRecord,
  RichOrderTimelineRecord,
} from "./types";

export default async function BusinessDashboardPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) notFound();

  const clerkUser = await currentUser();
  const ownerName = clerkUser?.firstName ? `, ${clerkUser.firstName}` : "";

  let business: FullDashboardBusinessData | null = null;
  let latestBookings: RichBookingTimelineRecord[] = [];
  let latestOrders: RichOrderTimelineRecord[] = [];

  try {
    const systemUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!systemUser) notFound();

    // Context Fallback Check
    const initialFetch = await prisma.business.findUnique({
      where: { slug: rawSlug },
      select: {
        id: true,
        ownerId: true,
        staff: { where: { isActive: true }, select: { id: true } },
        items: { select: { id: true, type: true } },
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

    business = initialFetch as FullDashboardBusinessData | null;

    if (!business) {
      const sanitizedSlug = rawSlug.startsWith("-")
        ? rawSlug.slice(1)
        : rawSlug;

      const fallbackFetch = await prisma.business.findUnique({
        where: { slug: sanitizedSlug },
        select: {
          id: true,
          ownerId: true,
          staff: { where: { isActive: true }, select: { id: true } },
          items: { select: { id: true, type: true } },
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

      business = fallbackFetch as FullDashboardBusinessData | null;
    }

    if (!business) notFound();

    // Multi-tenant Security Scope Boundary Validation
    if (business.ownerId !== systemUser.id) {
      const isRosteredStaff = await prisma.staffProfile.findFirst({
        where: {
          userId: systemUser.id,
          businessId: business.id,
          isActive: true,
        },
        select: { id: true },
      });
      if (!isRosteredStaff) notFound();
    }

    const [bookingsRaw, ordersRaw] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId: business.id },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.order.findMany({
        where: { businessId: business.id },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    latestBookings = bookingsRaw as RichBookingTimelineRecord[];
    latestOrders = ordersRaw as RichOrderTimelineRecord[];
  } catch (error: unknown) {
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

  const performanceTimelineData = computeTimelineData(
    business.bookings,
    business.orders,
  );
  const unifiedActivities = mergeActivities(latestBookings, latestOrders);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto min-w-0">
      <DashboardHeader ownerName={ownerName} />

      <DashboardMetricsWrapper business={business} />

      <div className="w-full min-w-0">
        <PerformanceCharts data={performanceTimelineData} />
      </div>

      <div className="w-full min-w-0">
        <RecentActivityFeed activities={unifiedActivities} />
      </div>
    </div>
  );
}
