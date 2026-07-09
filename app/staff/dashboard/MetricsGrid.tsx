// app/staff/dashboard/MetricsGrid.tsx
"use client";

import * as React from "react";
import { CalendarRange, CheckCircle2, ClipboardList } from "lucide-react";
import {
  ClientBookingDataShape,
  ClientOrderDataShape,
} from "./StaffDashboardClient";

interface MetricsGridProps {
  bookings: ClientBookingDataShape[];
  orders: ClientOrderDataShape[];
}

export function MetricsGrid({ bookings, orders }: MetricsGridProps) {
  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING",
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.status === "COMPLETED",
  ).length;
  const processingOrders = orders.filter(
    (o) => o.status === "PROCESSING" || o.status === "PENDING",
  ).length;

  const cardConfig = [
    {
      title: "My Bookings",
      value: activeBookings,
      label: "Assigned Load",
      icon: CalendarRange,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Completed",
      value: completedBookings,
      label: "Closed Loops",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Active Orders",
      value: processingOrders,
      label: "Awaiting Handover",
      icon: ClipboardList,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full min-w-0">
      {cardConfig.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-6 border border-border bg-card rounded-2xl shadow-sm flex items-center justify-between min-w-0 group hover:shadow-md transition-all duration-200"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {card.title}
              </p>
              <h3 className="text-3xl font-black text-foreground tracking-tight tabular-nums mt-1 leading-none">
                {card.value}
              </h3>
              <p className="text-[10px] font-medium text-muted-foreground/80 pt-1">
                {card.label}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl shrink-0 ${card.color} border group-hover:scale-105 transition-transform duration-200`}
            >
              <Icon className="h-5 w-5 shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
