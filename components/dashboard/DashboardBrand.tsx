"use client";

import Image from "next/image";
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";

// One logo treatment for the admin, business and staff dashboards so they look
// like the same product. Change the sizes here and all three follow.
export const DASHBOARD_LOGO_SIZE = 30; // sidebars and drawers
export const DASHBOARD_BAR_LOGO_SIZE = 24; // slim mobile top bar

interface DashboardBrandProps {
  /** Small line under the logo: "Admin", the business name, "Staff Portal". */
  subtitle?: string;
  /** Optional second muted line. */
  caption?: string;
  /** Collapsed desktop sidebar: show only the round mark. */
  collapsed?: boolean;
}

export function DashboardBrand({
  subtitle,
  caption,
  collapsed = false,
}: DashboardBrandProps) {
  if (collapsed) {
    return (
      <div className="flex w-full items-center justify-center">
        <Image
          src="/freshpoint-mark.svg"
          alt="FreshPoint"
          width={32}
          height={32}
          priority
          className="h-8 w-8 shrink-0"
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <FreshpointLogo size={DASHBOARD_LOGO_SIZE} />
      {subtitle && (
        <span className="truncate text-[10px] font-bold uppercase leading-none tracking-wide text-muted-foreground">
          {subtitle}
        </span>
      )}
      {caption && (
        <span className="truncate text-[10px] font-semibold uppercase leading-none tracking-wider text-muted-foreground/80">
          {caption}
        </span>
      )}
    </div>
  );
}
