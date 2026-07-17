// components/booking/BookingTableRow.tsx
"use client";

import React from "react";
import {
  Landmark,
  Clock,
  MapPin,
  Eye,
  Ticket,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalBookingTableData } from "./types";

interface RowProps {
  booking: LocalBookingTableData;
  onSelect: (booking: LocalBookingTableData) => void;
}

export function BookingTableRow({ booking, onSelect }: RowProps) {
  const isOutCall = booking.locationType === "OUT_CALL";
  const displayVoucher = booking.queueCode
    ? booking.queueCode
    : `#${booking.id.slice(-6).toUpperCase()}`;

  const compactCurrency = (val: number | null) => {
    if (val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
    }).format(val);
  };

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      {/* 🌟 COLUMN 1: Isolated High-Contrast Access Voucher Code */}
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-black uppercase tracking-tight bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/20 shadow-xs">
          <Ticket className="h-3.5 w-3.5 text-primary/80" />
          {displayVoucher}
        </span>
      </td>

      {/* COLUMN 2: Treatment Provider & Address Info */}
      <td className="px-6 py-4 max-w-xs">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-foreground truncate block text-sm">
            {booking.business?.name || "Premium Wellness Hub"}
          </span>
          <span className="text-xs text-muted-foreground truncate flex items-center gap-1 font-medium">
            <Landmark className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            {booking.business?.address || "Storefront Location"}
          </span>
        </div>
      </td>

      {/* COLUMN 3: Lifecycle Timeline Matrix */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block leading-none mb-1">
              Appointment Date
            </span>
            <span className="font-bold text-foreground text-sm">
              {new Date(booking.startTime).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </span>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 font-medium ml-1.5">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              {new Date(booking.startTime).toLocaleTimeString("en-NG", {
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="pt-0.5 border-t border-dashed border-border/60">
            <span className="text-[10px] text-muted-foreground font-medium inline-flex items-center gap-1">
              <CalendarPlus className="h-3 w-3 text-muted-foreground/60" />
              Booked on:{" "}
              {new Date(booking.startTime).toLocaleDateString("en-NG", {
                dateStyle: "short",
              })}
            </span>
          </div>
        </div>
      </td>

      {/* COLUMN 4: Price Metric */}
      <td className="px-6 py-4 text-center font-bold text-foreground whitespace-nowrap">
        <span
          title={`₦${Number(booking.totalAmount || 0).toLocaleString()}`}
          className="cursor-help"
        >
          {compactCurrency(booking.totalAmount)}
        </span>
      </td>

      {/* COLUMN 5: Fulfillment Mode */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            isOutCall
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <MapPin className="h-3 w-3" />
          {isOutCall ? "Out-Call Service" : "In-Shop Hub"}
        </span>
      </td>

      {/* COLUMN 6: Status Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
            booking.status === "CONFIRMED" || booking.status === "completed"
              ? "bg-green-500/10 text-green-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          {booking.status}
        </span>
      </td>

      {/* COLUMN 7: Action Trigger */}
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSelect(booking)}
          className="text-primary hover:bg-primary/10 rounded-xl font-bold gap-1 text-xs cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View Details</span>
        </Button>
      </td>
    </tr>
  );
}
