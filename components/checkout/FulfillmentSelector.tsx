"use client";

import React from "react";
import { Store, Truck, MapPin } from "lucide-react";

interface FulfillmentSelectorProps {
  isDelivery: boolean;
  onChange: (value: boolean) => void;
  addressValue: string;
  onAddressChange: (value: string) => void;
  notesValue: string;
  onNotesChange: (value: string) => void;
}

export default function FulfillmentSelector({
  isDelivery,
  onChange,
  addressValue,
  onAddressChange,
  notesValue,
  onNotesChange,
}: FulfillmentSelectorProps) {
  return (
    <div className="space-y-4 border border-border rounded-2xl p-5 bg-card shadow-2xs">
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        <Truck className="w-4 h-4 text-primary" />
        Fulfillment Option
      </h2>

      {/* Simplified Dual Button Group */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(false)} // isDelivery = false
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
            !isDelivery
              ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
              : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
          }`}
        >
          <Store className="w-5 h-5" />
          <div className="text-sm font-bold">Store Pickup</div>
          <span className="text-[10px] opacity-80">Collect at storefront</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(true)} // isDelivery = true
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
            isDelivery
              ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
              : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
          }`}
        >
          <Truck className="w-5 h-5" />
          <div className="text-sm font-bold">Home Delivery</div>
          <span className="text-[10px] opacity-80">
            Dispatch to your location
          </span>
        </button>
      </div>

      {/* Conditional Delivery Subforms */}
      {isDelivery && (
        <div className="space-y-3 pt-2 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Destination
              Delivery Address
            </label>
            <input
              type="text"
              required
              value={addressValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onAddressChange(e.target.value)
              }
              placeholder="Enter your complete street address details..."
              className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Drop-off Notes / Instructions (Optional)
            </label>
            <input
              type="text"
              value={notesValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onNotesChange(e.target.value)
              }
              placeholder="e.g., call before arriving, drop at security post..."
              className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

      {!isDelivery && (
        <p className="text-xs text-muted-foreground font-medium bg-muted/40 p-3 rounded-xl border border-border/40 leading-relaxed">
          The merchant partner&apos;s physical address will be shown on your
          invoice confirmation page for easy pickup.
        </p>
      )}
    </div>
  );
}
