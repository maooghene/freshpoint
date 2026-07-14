"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface OrderSummaryCardProps {
  currency: string;
  cartSubtotal: number;
  isDelivery: boolean;
  deliveryFee: number;
  absoluteFinalTotal: number;
  canPay: boolean;
  calculatingFee: boolean;
  payButton: ReactNode;
}

export function OrderSummaryCard({
  currency,
  cartSubtotal,
  isDelivery,
  deliveryFee,
  absoluteFinalTotal,
  canPay,
  calculatingFee,
  payButton,
}: OrderSummaryCardProps) {
  return (
    <div className="border border-border rounded-2xl p-4 bg-card space-y-3.5 shadow-sm">
      <div className="space-y-2 text-xs font-medium text-muted-foreground pb-2 border-b border-dashed border-border">
        <div className="flex justify-between items-center">
          <span>Cart Items Subtotal</span>
          <span className="text-foreground font-bold">
            {currency}
            {Number(cartSubtotal).toLocaleString()}
          </span>
        </div>
        {isDelivery && (
          <div className="flex justify-between items-center">
            <span>Delivery fee</span>
            <span className="text-primary font-bold">
              {currency}
              {Number(deliveryFee).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-muted-foreground">
          Settled Total Amount
        </span>
        <span className="font-black text-xl text-primary">
          {currency}
          {Number(absoluteFinalTotal).toLocaleString()}
        </span>
      </div>

      {!canPay ? (
        <Button
          disabled
          className="w-full py-5 rounded-xl text-xs font-bold opacity-50 bg-muted text-muted-foreground"
        >
          {calculatingFee
            ? "Adjusting Surcharge Rates..."
            : "Provide Destination Address to Pay"}
        </Button>
      ) : (
        payButton
      )}
    </div>
  );
}
