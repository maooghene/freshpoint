"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";
import { DASHBOARD_BAR_LOGO_SIZE } from "./DashboardBrand";

interface MobileTopBarProps {
  onOpenMenu: () => void;
  /** Context line under the logo: "Admin", the business name, "Staff · Shop". */
  subtitle?: string;
  menuLabel?: string;
  /** Extra position classes, e.g. "fixed inset-x-0 top-0" for the staff shell. */
  className?: string;
}

// The same slim top bar for every dashboard on phones and tablets. Respects the
// notch (safe area) and keeps a 44px menu button so it is easy to tap.
export function MobileTopBar({
  onOpenMenu,
  subtitle,
  menuLabel = "Open menu",
  className = "",
}: MobileTopBarProps) {
  return (
    <header
      className={`z-30 w-full shrink-0 border-b border-border bg-card pt-[env(safe-area-inset-top)] lg:hidden ${className}`}
    >
      <div className="flex h-14 items-center gap-3 px-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={menuLabel}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-secondary/50 text-foreground transition-colors hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <FreshpointLogo size={DASHBOARD_BAR_LOGO_SIZE} />
          {subtitle && (
            <span className="truncate text-[10px] font-bold uppercase leading-none tracking-wide text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
