// components/orders/OrderTableRow.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Landmark,
  Clock,
  Truck,
  ReceiptText,
  TruckIcon,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  id: string;
  itemId: string;
  quantity: number;
  price: number;
  name: string;
  image: string | null;
}

interface HistoryOrder {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryFee: number;
  businessId: string;
  createdAt: string;
  business: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  items: HistoryItem[];
}

interface RowProps {
  order: HistoryOrder;
}

export function OrderTableRow({ order }: RowProps) {
  const displayId = order.code
    ? order.code
    : `#${order.id.slice(-6).toUpperCase()}`;
  const totalItemsCount = order.items.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const primaryItemName = order.items[0]?.name || "Item";
  const extraItemsCount = order.items.length - 1;

  const compactCurrency = (val: number | null) => {
    if (val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
    }).format(val);
  };

  // 🚀 FIXED: The "Receipt" button used to call onSelect(order), which only
  // set local state with nothing ever rendering it — clicking did nothing
  // visible. Now it routes straight to the real receipt page, reusing the
  // same lookup that already powers /orders/success after checkout.
  const receiptHref = `/orders/success?reference=${encodeURIComponent(
    order.code || order.id,
  )}`;

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      {/* 🌟 COLUMN 1: Isolated High-Contrast Order Identifier Code */}
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-black uppercase tracking-tight bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/20 shadow-xs">
          <ShoppingBag className="h-3.5 w-3.5 text-primary/80" />
          {displayId}
        </span>
      </td>

      {/* COLUMN 2: Vendor Details */}
      <td className="px-6 py-4 max-w-xs">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-foreground text-sm truncate block">
            {order.business.name}
          </span>
          <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1 font-medium">
            <Landmark className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            {order.business.address || "Marketplace Storefront"}
          </span>
        </div>
      </td>

      {/* COLUMN 3: Quantity Purchased */}
      <td className="px-6 py-4 max-w-[180px]">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-foreground text-sm truncate block">
            {primaryItemName}
            {extraItemsCount > 0 && (
              <span className="text-muted-foreground font-normal">
                {" "}
                {extraItemsCount} more
              </span>
            )}
          </span>
          <span className="text-xs bg-muted px-2.5 py-1 rounded-lg border border-border w-fit">
            {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
          </span>
        </div>
      </td>

      {/* COLUMN 4: Lifecycle Timeline Matrix */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block leading-none mb-1">
              Purchase Date
            </span>
            <span className="font-bold text-foreground text-sm">
              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </span>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 font-medium ml-1.5">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              {new Date(order.createdAt).toLocaleTimeString("en-NG", {
                timeStyle: "short",
              })}
            </span>
          </div>

          <div className="pt-0.5 border-t border-dashed border-border/60">
            <span className="text-[10px] text-muted-foreground font-medium inline-flex items-center gap-1">
              <TruckIcon className="h-3 w-3 text-muted-foreground/60" />
              {order.isDelivery
                ? "Dispatched / Arriving soon"
                : "Ready for In-Store pickup"}
            </span>
          </div>
        </div>
      </td>

      {/* COLUMN 5: Total Paid */}
      <td className="px-6 py-4 text-center font-bold text-foreground whitespace-nowrap">
        <span
          title={`₦${Number(order.totalAmount || 0).toLocaleString()}`}
          className="cursor-help"
        >
          {compactCurrency(order.totalAmount)}
        </span>
      </td>

      {/* COLUMN 6: Distribution Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            order.isDelivery
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Truck className="h-3 w-3" />
          {order.isDelivery ? "Home Delivery" : "Storefront Pickup"}
        </span>
      </td>

      {/* COLUMN 7: Status Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
            order.status.toLowerCase() === "completed" ||
            order.status.toLowerCase() === "delivered"
              ? "bg-green-500/10 text-green-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          {order.status}
        </span>
      </td>

      {/* COLUMN 8: Actions */}
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="text-primary hover:bg-primary/10 rounded-xl font-bold gap-1 text-xs cursor-pointer"
        >
          <Link href={receiptHref}>
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Receipt</span>
          </Link>
        </Button>
      </td>
    </tr>
  );
}
