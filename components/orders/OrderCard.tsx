"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Home,
  Store,
  ShoppingBag,
  MapPin,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewModal } from "./ReviewModal";

interface HistoryItem {
  id: string;
  itemId: string;
  quantity: number;
  price: number;
  name: string;
  image: string | null;
}

interface OrderCardProps {
  order: {
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    isDelivery: boolean;
    deliveryAddress: string | null;
    businessId: string; // Ensure your server page passes this token property down!
    createdAt: string;
    business: { name: string };
    items: HistoryItem[];
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const currency = "₦";
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReviewItem, setActiveReviewItem] = useState<HistoryItem | null>(
    null,
  );

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isFulfilled =
    order.status.toUpperCase() === "COMPLETED" ||
    order.status.toUpperCase() === "DELIVERED";
  const isProcessing =
    order.status.toUpperCase() === "PROCESSING" ||
    order.status.toUpperCase() === "PENDING" ||
    order.status.toUpperCase() === "SHIPPED";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200">
      {/* Header Banner */}
      <div className="p-4 px-5 bg-muted/20 border-b border-border flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <Calendar className="w-3.5 h-3.5" /> {formattedDate}
          </span>
          <span className="text-border">•</span>
          <span className="font-mono text-foreground font-black text-sm bg-background border border-border px-2.5 py-0.5 rounded-lg">
            {order.code
              ? order.code
              : `ID: #${order.id.slice(-8).toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {order.isDelivery ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
              <Home className="w-3 h-3" /> Delivery
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-secondary text-secondary-foreground border border-border">
              <Store className="w-3 h-3" /> Pickup
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${isFulfilled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : isProcessing ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-muted text-muted-foreground border-border"}`}
          >
            {order.status.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Info Block */}
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Vendor Shop
            </p>
            <h4 className="font-bold text-foreground tracking-tight">
              {order.business.name}
            </h4>
          </div>
          {order.isDelivery && order.deliveryAddress && (
            <div className="space-y-1 text-left sm:text-right max-w-xs">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex sm:justify-end items-center gap-1">
                <MapPin className="w-3 h-3" /> Destination
              </p>
              <p className="text-xs text-muted-foreground font-medium truncate">
                {order.deliveryAddress}
              </p>
            </div>
          )}
        </div>

        {/* Item Rows List */}
        <div className="divide-y divide-border/60 border border-border/80 rounded-xl bg-background/40 overflow-hidden">
          {order.items.map((lineItem) => (
            <div
              key={lineItem.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 relative bg-muted rounded-xl overflow-hidden border shrink-0 border-border">
                  <Image
                    src={lineItem.image || "/placeholder-product.jpg"}
                    alt={lineItem.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-foreground truncate block max-w-[200px] sm:max-w-sm">
                    {lineItem.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {currency}
                    {lineItem.price.toLocaleString()} × {lineItem.quantity}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                <span className="font-black text-foreground">
                  {currency}
                  {(lineItem.price * lineItem.quantity).toLocaleString()}
                </span>
                {isFulfilled && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReviewItem(lineItem);
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-primary bg-primary/5 hover:bg-primary/15 px-3 py-1.5 rounded-xl border border-primary/10 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Rate Item
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Sum */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground block">
              Total Amount Settled
            </span>
            <span className="text-lg font-black text-foreground">
              {currency}
              {order.totalAmount.toLocaleString()}
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-lg font-bold text-xs bg-card border-border shadow-2xs"
          >
            <Link
              href={`/orders/success?reference=${encodeURIComponent(order.id)}`}
              className="flex items-center gap-1"
            >
              View Receipt <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 🚀 FIXED INJECTION: Explicitly passing order.businessId down to the review modal layer */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orderId={order.id}
        businessId={order.businessId}
        item={activeReviewItem}
      />
    </div>
  );
}
