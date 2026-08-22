"use client";

import React from "react";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface OrderStatusStatsProps {
  orders: Array<{ status: OrderStatus }>;
}

export function OrderStatusStats({ orders }: OrderStatusStatsProps) {
  // 🚀 FIXED: Added "SHIPPED" to the array grid parameters map list
  const statuses: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {" "}
      {/* Changed col layout from sm:grid-cols-4 to sm:grid-cols-5 */}
      {statuses.map((status) => {
        const count = orders.filter((o) => o.status === status).length;
        return (
          <div
            key={status}
            className="bg-card border border-border rounded-2xl p-4 space-y-1"
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </p>
            <p className="text-2xl font-black text-foreground">{count}</p>
          </div>
        );
      })}
    </div>
  );
}
