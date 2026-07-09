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
    /* 
      MASTER TWCSS IMPLEMENTATION: 
      Instead of forcing xl:grid-cols-6 immediately, we use 3 columns on standard desktops (lg/xl) 
      to preserve layout space, and scale to 6 columns only on ultra-wide screens (2xl).
    */
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 w-full min-w-0">
      <StatCard
        title="Total Revenue"
        value={formattedRevenue}
        icon={Banknote}
        color="text-emerald-500"
      />
      <StatCard
        title="Active Bookings"
        value={activeBookingsCount}
        icon={CalendarCheck2}
        color="text-primary"
      />
      <StatCard
        title="Active Orders"
        value={activeOrdersCount}
        icon={PackageCheck}
        color="text-primary"
      />
      <StatCard
        title="Active Staff"
        value={totalStaffCount}
        icon={Users}
        color="text-sky-500"
      />
      <StatCard
        title="Total Services"
        value={totalServicesCount}
        icon={Layers}
        color="text-amber-500"
      />
      <StatCard
        title="Total Products"
        value={totalProductsCount}
        icon={ShoppingBag}
        color="text-indigo-500"
      />
    </div>
  );
}
