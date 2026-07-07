"use client";

import React from "react";
import { PackageIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item: { name: string; image: string | null };
}

interface BusinessOrderCardProps {
  order: {
    id: string;
    code: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
    user: { firstName: string | null; lastName: string | null; email: string };
    items: OrderItem[];
  };
  statusStyles: Record<OrderStatus, string>;
  statusTransitions: Record<OrderStatus, OrderStatus[]>;
  updatingId: string | null;
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>;
}

export function BusinessOrderCard({
  order,
  statusStyles,
  statusTransitions,
  updatingId,
  onStatusUpdate,
}: BusinessOrderCardProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/20 transition-all">
      {/* CARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* ── UNIFIED ALPHANUMERIC IDENTIFIER MATCH BLOCK ── */}
            <p className="text-xs font-mono font-black text-foreground bg-muted border border-border/80 px-2 py-0.5 rounded-lg shadow-2xs">
              {order.code ? order.code : `#${order.id.slice(-8).toUpperCase()}`}
            </p>

            <Badge
              className={`text-[10px] font-bold px-2 border ${statusStyles[order.status]}`}
            >
              {order.status}
            </Badge>
          </div>
          <p className="text-sm font-bold text-foreground">
            {order.user.firstName} {order.user.lastName}
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              {order.user.email}
            </span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <p
            className="text-xs text-muted-foreground font-medium"
            suppressHydrationWarning
          >
            {formattedDate}
          </p>
          <p className="text-lg font-black text-foreground">
            ₦{Number(order.totalAmount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ITEMS MAP LOOP */}
      <div className="border-t border-border pt-4 space-y-2">
        {order.items.map((orderItem) => (
          <div
            key={orderItem.id}
            className="flex items-center justify-between text-sm gap-4"
          >
            <div className="flex items-center gap-2 min-w-0">
              <PackageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-foreground font-medium truncate">
                {orderItem.item.name}
              </span>
              <span className="text-muted-foreground shrink-0">
                × {orderItem.quantity}
              </span>
            </div>
            <span className="font-bold text-foreground shrink-0">
              ₦{Number(orderItem.price * orderItem.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* MUTATION TRIGGERS CONTROLS */}
      {statusTransitions[order.status].length > 0 ? (
        <div className="border-t border-border pt-4 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Update status:
          </span>
          {statusTransitions[order.status].map((newStatus) => (
            <button
              key={newStatus}
              onClick={() => onStatusUpdate(order.id, newStatus)}
              disabled={updatingId === order.id}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${statusStyles[newStatus]}`}
            >
              {updatingId === order.id && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              Mark {newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      ) : (
        <div className="border-t border-border pt-4">
          <span
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1 ${statusStyles[order.status]}`}
          >
            {order.status === "DELIVERED" ? "✓ Delivered" : "✗ Cancelled"}
          </span>
        </div>
      )}
    </div>
  );
}
