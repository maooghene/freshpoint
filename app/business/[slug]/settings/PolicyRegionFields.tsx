"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Globe, Coins } from "lucide-react";

interface RegionFieldsProps {
  business: {
    timezone: string;
    currencyCode: string;
  };
  isPending: boolean;
}

export function PolicyRegionFields({ business, isPending }: RegionFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-border/60 pt-4">
      <div className="space-y-2">
        <Label
          htmlFor="timezone"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Globe className="h-4 w-4 text-muted-foreground/80" /> Your Timezone
        </Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={business.timezone}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="Africa/Lagos">Nigeria (GMT+1)</option>
          <option value="Africa/Accra">Ghana (GMT+0)</option>
          <option value="Europe/London">UK (GMT+0)</option>
          <option value="America/New_York">USA (EST)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="currencyCode"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Coins className="h-4 w-4 text-muted-foreground/80" /> Shop Currency
        </Label>
        <select
          id="currencyCode"
          name="currencyCode"
          defaultValue={business.currencyCode}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="NGN">Naira (₦)</option>
          <option value="GHS">Cedi (₵)</option>
          <option value="USD">US Dollar ($)</option>
          <option value="GBP">Pound (£)</option>
        </select>
      </div>
    </div>
  );
}
