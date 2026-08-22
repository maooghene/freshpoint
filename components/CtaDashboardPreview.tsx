"use client";

import * as React from "react";
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  ShieldCheck,
  MapPin,
  Clock,
} from "lucide-react";

type PreviewTabMode = "BOOKINGS" | "PRODUCTS" | "DELIVERIES";

export function CtaDashboardPreview({
  activeTab,
}: {
  activeTab: PreviewTabMode;
}) {
  return (
    <div className="relative w-full max-w-[440px] aspect-[4/3] rounded-2xl border border-border/80 bg-card p-4 shadow-xl overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />

      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[9px] font-mono text-muted-foreground/50 ml-1">
            {activeTab === "BOOKINGS" && "merchant_booking_ledger"}
            {activeTab === "PRODUCTS" && "merchant_retail_orders"}
            {activeTab === "DELIVERIES" && "merchant_distance_logistics"}
          </span>
        </div>
        <span className="text-[9px] font-bold bg-muted px-2 py-0.5 rounded-md text-muted-foreground/80">
          {"Live Matrix"}
        </span>
      </div>

      {activeTab === "BOOKINGS" && (
        <>
          <div className="grid grid-cols-2 gap-3 my-1">
            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {"Schedules"}
              </span>
              <p className="text-base font-black text-foreground">
                {"14 Appts"}
              </p>
            </div>
            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {"Staff Load"}
              </span>
              <p className="text-base font-black text-foreground">
                {"92% Busy"}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 flex flex-col justify-center">
            <div className="p-2 bg-background border rounded-xl flex items-center justify-between text-xs shadow-2xs">
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">
                  {"Amara Nwosu"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {"Laser Acne Treatment Consultation"}
                </p>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {"14:30 PM"}
              </span>
            </div>
          </div>
        </>
      )}

      {activeTab === "PRODUCTS" && (
        <>
          <div className="grid grid-cols-2 gap-3 my-1">
            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {"Product Sales"}
              </span>
              <p className="text-base font-black text-primary">{"₦84,000"}</p>
            </div>
            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {"Low Stock Alerts"}
              </span>
              <p className="text-base font-black text-amber-500">{"2 Items"}</p>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 flex flex-col justify-center">
            <div className="p-2 bg-background border rounded-xl flex items-center justify-between text-xs shadow-2xs">
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">
                  {"Organic Hair Growth Oil"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {"Qty: 3 • Paystack Cleared"}
                </p>
              </div>
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {"Packaged"}
              </span>
            </div>
          </div>
        </>
      )}

      {activeTab === "DELIVERIES" && (
        <>
          {/* 🌟 FIXED: Swapped "Active Riders" block out to show distance billing automation tools */}
          <div className="grid grid-cols-2 gap-3 my-1">
            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {"Fulfillment Type"}
              </span>
              <p className="text-base font-black text-foreground">
                {"Pickup / Delivery"}
              </p>
            </div>
            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                {"Logistics Flow"}
              </span>
              <p className="text-base font-black text-emerald-600">
                {"Auto-Calculated"}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 flex flex-col justify-center">
            <div className="p-2.5 bg-background border rounded-xl space-y-1 text-[11px] shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" /> {"Lekki Phase 1"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />{" "}
                  {"12.4 km from Shop"}
                </span>
              </div>
              <div className="text-[10px] font-bold text-foreground border-t border-dashed border-border/60 pt-1 flex justify-between">
                {/* 🌟 FIXED: Clear statement shows the platform acts as the calculation engine only */}
                <span>{"Automated Delivery Fee (Paid to Vendor):"}</span>
                <span className="text-primary">{"₦2,400"}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[9px] font-bold text-muted-foreground/60 tracking-tight">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span>{"Merchant pipeline online"}</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>{"Secured by Paystack"}</span>
        </div>
      </div>
    </div>
  );
}
