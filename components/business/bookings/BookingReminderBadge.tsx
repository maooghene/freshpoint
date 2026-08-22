"use client";

import * as React from "react";
import { MailCheck, MailWarning } from "lucide-react";

interface ReminderBadgeProps {
  isReminderSent: boolean;
}

export function BookingReminderBadge({ isReminderSent }: ReminderBadgeProps) {
  if (isReminderSent) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-mono font-medium mt-1">
        <MailCheck className="h-3 w-3" />
        <span>24h Email Sent</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/60 text-[10px] font-mono mt-1">
      <MailWarning className="h-3 w-3 opacity-60" />
      <span>Reminder Queued</span>
    </span>
  );
}
