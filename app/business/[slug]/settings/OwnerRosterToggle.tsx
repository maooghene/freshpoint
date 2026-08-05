"use client";

import * as React from "react";
import { toggleOwnerRosterStatus } from "./toggleAction";
import { Users, ShieldAlert, Loader2, Sparkles, Building } from "lucide-react";

interface OwnerRosterToggleProps {
  businessId: string;
  initialIsActive: boolean | undefined; // Accept optionals safely
}

export function OwnerRosterToggle({
  businessId,
  initialIsActive,
}: OwnerRosterToggleProps) {
  // 🎯 COALESCE VALUE FIX: Enforces a solid default boolean primitive
  const [isActive, setIsActive] = React.useState<boolean>(!!initialIsActive);
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const handleToggle = async (checked: boolean) => {
    setIsPending(true);
    const result = await toggleOwnerRosterStatus(businessId, checked);
    setIsPending(false);

    if (result.success) {
      setIsActive(result.isActive ?? false);
    } else {
      alert(
        result.error ||
          "Failed to update profile parameter state status definitions.",
      );
    }
  };

  return (
    <div className="border border-border bg-card rounded-xl overflow-hidden shadow-xs w-full text-card-foreground">
      <div className="p-5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Operational Roster Configuration
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Determine if you provide services directly on the floor or manage
              staff administratively.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-6 p-4 rounded-xl border border-border/80 bg-background/50 shadow-inner">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              {isActive ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  Active Provider On-Duty
                </>
              ) : (
                <>
                  <Building className="h-3.5 w-3.5 text-amber-600" />
                  Pure Administrative Management Mode
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              {isActive
                ? "Your name is listed on booking catalogs. Customers can select you, and auto-assign loops can pass jobs into your view."
                : "You are hidden from client-facing selection boxes. Booking loops ignore your calendar, keeping you in an observer layout."}
            </p>
          </div>

          <div className="relative flex items-center shrink-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isPending}
                checked={isActive}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary disabled:opacity-40"></div>
            </label>
            {isPending && (
              <div className="absolute -right-6 top-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <p className="font-medium leading-relaxed">
            <span className="font-bold">Access Alert:</span> Disabling calendar
            duty states does <span className="font-black underline">not</span>{" "}
            block your owner dashboard authorization clearance. You can always
            inspect all store revenue metric streams and orders seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
}
