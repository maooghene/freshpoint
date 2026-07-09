"use client";

import React from "react";
import {
  ShoppingBagIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon,
  SparklesIcon,
  PackageIcon,
} from "lucide-react";
import ReceiptHeader from "./ReceiptHeader";
import ReceiptFulfillment from "./ReceiptFulfillment";
import { OrderData, OrderItem } from "./types";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface ReceiptCardProps {
  order: OrderData;
}

export default function ReceiptCard({ order }: ReceiptCardProps) {
  const currency = "₦";

  if (!order || !order.id) {
    return (
      <div className="p-8 border border-dashed border-border rounded-2xl text-center bg-muted/20">
        <SparklesIcon className="w-6 h-6 text-primary mx-auto mb-2 animate-pulse" />
        <p className="text-xs font-semibold text-muted-foreground">
          Loading order details...
        </p>
      </div>
    );
  }

  const subtotal =
    order.items?.reduce(
      (acc, lineItem) =>
        acc + (Number(lineItem.price) || 0) * lineItem.quantity,
      0,
    ) || 0;

  return (
    <div className="bg-card border border-border rounded-[2rem] shadow-xl overflow-hidden transition-all duration-200">
      <ReceiptHeader orderId={order.id} orderCode={order.code} />

      <div className="p-6 space-y-6">
        <ReceiptFulfillment
          isDelivery={order.isDelivery}
          deliveryAddress={order.deliveryAddress}
          deliveryNotes={order.deliveryNotes}
        />

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBagIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sold by
            </p>
            <h3 className="text-base font-black text-foreground tracking-tight truncate">
              {order.business?.name || "Unknown Provider"}
            </h3>
            <div className="flex flex-col gap-1 pt-1">
              {order.business?.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <MapPinIcon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  {order.business.address}
                </p>
              )}
              {order.business?.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <PhoneIcon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  {order.business.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Items Purchased
            </p>
          </div>

          <div className="space-y-2">
            {order.items?.map((lineItem: OrderItem) => {
              const unitPrice = Number(lineItem.price) || 0;
              const lineTotal = unitPrice * lineItem.quantity;

              return (
                <div
                  key={lineItem.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-background/60 hover:bg-muted/20 transition-colors"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                    <ImageWithFallback
                      src={lineItem.item?.image ?? null}
                      alt={lineItem.item?.name || "Product"}
                      icon={PackageIcon}
                      label=""
                      sizes="56px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {lineItem.item?.name || "Product Item"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {lineItem.quantity} × {currency}
                      {unitPrice.toLocaleString()}
                    </p>
                  </div>

                  <span className="text-sm font-black text-foreground shrink-0">
                    {currency}
                    {lineTotal.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-border" />
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Subtotal</span>
            <span className="font-bold text-foreground">
              {currency}
              {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <CreditCardIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
              Payment method
            </span>
            <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg">
              Paystack
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">
              Order status
            </span>
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {order.status?.toLowerCase() || "processing"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Total Paid
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Inclusive of all charges
            </p>
          </div>
          <span className="text-3xl font-black text-primary tracking-tight">
            {currency}
            {Number(order.totalAmount || 0).toLocaleString()}
          </span>
        </div>

        <div className="text-center pt-2 border-t border-border/50 space-y-1">
          <p className="text-[10px] text-muted-foreground/50 font-mono text-sm tracking-tight break-all">
            Reference Tracking ID: {order.id}
          </p>
          <p className="text-[10px] text-muted-foreground/40 font-medium">
            Powered by FreshPoint • Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}
