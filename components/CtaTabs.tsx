"use client";

import * as React from "react";
import { Calendar, ShoppingBag, Truck } from "lucide-react";

type PreviewTabMode = "BOOKINGS" | "PRODUCTS" | "DELIVERIES";

interface CtaTabsProps {
  activeTab: PreviewTabMode;
  setActiveTab: (tab: PreviewTabMode) => void;
}

export function CtaTabs({ activeTab, setActiveTab }: CtaTabsProps) {
  return (
    <div className="flex bg-muted/60 p-1 border rounded-xl gap-1 w-full max-w-[440px]">
      <button
        type="button"
        onClick={() => setActiveTab("BOOKINGS")}
        className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
          activeTab === "BOOKINGS"
            ? "bg-card text-primary shadow-xs border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Calendar className="w-3 h-3" />
        {"Calendar"}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("PRODUCTS")}
        className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
          activeTab === "PRODUCTS"
            ? "bg-card text-primary shadow-xs border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ShoppingBag className="w-3 h-3" />
        {"E-Commerce"}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("DELIVERIES")}
        className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
          activeTab === "DELIVERIES"
            ? "bg-card text-primary shadow-xs border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Truck className="w-3 h-3" />
        {"Deliveries"}
      </button>
    </div>
  );
}
