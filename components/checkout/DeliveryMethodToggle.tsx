"use client";

import { Store, Truck } from "lucide-react";

interface DeliveryMethodToggleProps {
  isDelivery: boolean;
  onChange: (isDelivery: boolean) => void;
}

export function DeliveryMethodToggle({
  isDelivery,
  onChange,
}: DeliveryMethodToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`p-4 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-sm font-bold transition-all ${!isDelivery ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
      >
        <Store className="w-4 h-4" /> Store Pickup
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`p-4 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-sm font-bold transition-all ${isDelivery ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
      >
        <Truck className="w-4 h-4" /> Home Delivery
      </button>
    </div>
  );
}
