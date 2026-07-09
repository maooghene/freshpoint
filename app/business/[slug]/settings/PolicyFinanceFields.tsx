"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Globe, Coins } from "lucide-react";

interface FinanceFieldsProps {
  business: {
    timezone: string;
    currencyCode: string;
    requireDeposit: boolean;
    depositPercentage: number;
  };
  isPending: boolean;
  errors?: {
    depositPercentage?: string[];
  };
}

export function PolicyFinanceFields({
  business,
  isPending,
  errors,
}: FinanceFieldsProps) {
  const [hasDeposit, setHasDeposit] = useState<boolean>(
    business.requireDeposit,
  );

  return (
    <div className="space-y-6 border-t border-border/60 pt-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="timezone"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <Globe className="h-4 w-4 text-muted-foreground/80" /> System
            Timezone Alignment
          </Label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={business.timezone}
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          >
            <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
            <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="currencyCode"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <Coins className="h-4 w-4 text-muted-foreground/80" /> Default
            Platform Currency
          </Label>
          <select
            id="currencyCode"
            name="currencyCode"
            defaultValue={business.currencyCode}
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          >
            <option value="NGN">Naira (₦) - NGN</option>
            <option value="GHS">Cedi (₵) - GHS</option>
            <option value="USD">Dollar ($) - USD</option>
            <option value="GBP">Pound (£) - GBP</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="requireDepositToggle"
              className="text-sm font-bold text-foreground"
            >
              Enforce Part-Payment Deposits
            </Label>
            <p className="text-xs text-muted-foreground">
              Require clients to pay an upfront percentage before booking
              validation triggers.
            </p>
          </div>
          <input
            type="checkbox"
            id="requireDepositToggle"
            checked={hasDeposit}
            onChange={(e) => setHasDeposit(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
          />
          <input
            type="hidden"
            name="requireDeposit"
            value={hasDeposit ? "true" : "false"}
          />
        </div>

        {hasDeposit && (
          <div className="space-y-2 pt-2 border-t border-border/40 animate-in fade-in duration-200">
            <Label
              htmlFor="depositPercentage"
              className="flex items-center gap-2 text-xs font-semibold text-foreground/90"
            >
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" /> Retained
              Deposit Percentage (%)
            </Label>
            <Input
              id="depositPercentage"
              name="depositPercentage"
              type="number"
              min="1"
              max="100"
              defaultValue={business.depositPercentage || 20}
              disabled={isPending}
              placeholder="20"
              className="w-full sm:w-32 bg-background"
            />
            {errors?.depositPercentage && (
              <p className="text-xs font-medium text-destructive">
                {errors.depositPercentage[0]}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
