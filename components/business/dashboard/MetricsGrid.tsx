"use client";

import React from "react";
import {
  Banknote,
  CalendarCheck2,
  PackageCheck,
  Users,
  Layers,
  ShoppingBag,
} from "lucide-react";
import StatCard from "@/components/business/dashboard/StatCard";

interface MetricsGridProps {
  formattedRevenue: string;
  activeBookingsCount: number;
  activeOrdersCount: number;
  totalStaffCount: number;
  totalServicesCount: number;
  totalProductsCount: number;
}

export function MetricsGrid({
  formattedRevenue,
  activeBookingsCount,
  activeOrdersCount,
  totalStaffCount,
  totalServicesCount,
  totalProductsCount,
}: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 min-w-0 w-full">
      <StatCard
        title="Total Revenue"
        value={formattedRevenue}
        icon={Banknote}
        color="text-emerald-500"
      />
      <StatCard
        title="Active Bookings"
        value={String(activeBookingsCount)}
        icon={CalendarCheck2}
        color="text-primary"
      />
      <StatCard
        title="Active Orders"
        value={String(activeOrdersCount)}
        icon={PackageCheck}
        color="text-primary"
      />
      <StatCard
        title="Active Staff"
        value={String(totalStaffCount)}
        icon={Users}
        color="text-sky-500"
      />
      <StatCard
        title="Total Services"
        value={String(totalServicesCount)}
        icon={Layers}
        color="text-amber-500"
      />
      <StatCard
        title="Total Products"
        value={String(totalProductsCount)}
        icon={ShoppingBag}
        color="text-indigo-500"
      />
    </div>
  );
}
