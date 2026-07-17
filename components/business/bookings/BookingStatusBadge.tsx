"use client";

import * as React from "react";
import { BookingStatus } from "./types";

interface StatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: StatusBadgeProps) {
  const themes = {
    CONFIRMED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    COMPLETED: "bg-primary/10 text-primary",
    CANCELLED: "bg-destructive/10 text-destructive",
  };

  const activeTheme = themes[status] || themes.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 rounded-full ${activeTheme}`}
    >
      <span className="text-[8px] leading-none shrink-0">●</span>
      <span>{status}</span>
    </span>
  );
}
