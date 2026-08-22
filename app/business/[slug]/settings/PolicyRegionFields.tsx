"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Globe2, Coins } from "lucide-react";

interface RegionFieldsProps {
  business: {
    timezone: string;
    currencyCode: string;
  };
  isPending: boolean;
}

const TIMEZONE_OPTIONS = [
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Accra", label: "Africa/Accra (GMT)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
];

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "USD", label: "USD — US Dollar" },
];

export function PolicyRegionFields({ business, isPending }: RegionFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <Label
          htmlFor="timezone"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Globe2 className="h-4 w-4 text-muted-foreground/80" /> Storefront
          timezone
        </Label>
        <p className="text-xs text-muted-foreground">
          Booking slots and reminders are calculated against this timezone.
        </p>
        <select
          id="timezone"
          name="timezone"
          defaultValue={business.timezone}
          disabled={isPending}
          required
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          {TIMEZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="currencyCode"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Coins className="h-4 w-4 text-muted-foreground/80" /> Currency
        </Label>
        <p className="text-xs text-muted-foreground">
          Prices and invoices for this storefront are shown in this currency.
        </p>
        <select
          id="currencyCode"
          name="currencyCode"
          defaultValue={business.currencyCode}
          disabled={isPending}
          required
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}



