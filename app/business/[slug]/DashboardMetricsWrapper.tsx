import * as React from "react";
import { BookingStatus, OrderStatus } from "@prisma/client";
import { MetricsGrid } from "@/components/business/dashboard/MetricsGrid";
import {
  FullDashboardBusinessData,
  DashboardItemSubset,
  DashboardBookingSubset,
  DashboardOrderSubset,
} from "./types";

interface DashboardMetricsWrapperProps {
  business: FullDashboardBusinessData;
}

export default function DashboardMetricsWrapper({
  business,
}: DashboardMetricsWrapperProps) {
  const totalServicesCount = business.items.filter(
    (i: DashboardItemSubset) => i.type === "SERVICE",
  ).length;

  const totalProductsCount = business.items.filter(
    (i: DashboardItemSubset) => i.type === "PRODUCT",
  ).length;

  const totalStaffCount = business.staff.length;

  const bookingRevenue = business.bookings
    .filter((b: DashboardBookingSubset) => b.status === BookingStatus.COMPLETED)
    .reduce(
      (sum: number, b: DashboardBookingSubset) => sum + (b.totalAmount || 0),
      0,
    );

  const orderRevenue = business.orders
    .filter((o: DashboardOrderSubset) => o.status === OrderStatus.DELIVERED)
    .reduce(
      (sum: number, o: DashboardOrderSubset) => sum + (o.totalAmount || 0),
      0,
    );

  const formattedRevenue = `₦${(bookingRevenue + orderRevenue).toLocaleString()}`;

  const activeBookingsCount = business.bookings.filter(
    (b: DashboardBookingSubset) =>
      b.status === BookingStatus.CONFIRMED ||
      b.status === BookingStatus.PENDING,
  ).length;

  const activeOrdersCount = business.orders.filter(
    (o: DashboardOrderSubset) =>
      o.status === OrderStatus.PENDING ||
      o.status === OrderStatus.PROCESSING ||
      o.status === OrderStatus.SHIPPED,
  ).length;

  return (
    <MetricsGrid
      formattedRevenue={formattedRevenue}
      activeBookingsCount={activeBookingsCount}
      activeOrdersCount={activeOrdersCount}
      totalStaffCount={totalStaffCount}
      totalServicesCount={totalServicesCount}
      totalProductsCount={totalProductsCount}
    />
  );
}
