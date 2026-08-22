"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";

interface SecurityNoticeBannerProps {
  role: string;
}

export function SecurityNoticeBanner({ role }: SecurityNoticeBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4 border border-border">
      <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Workforce Security Level
        </span>
        <p className="text-xs text-foreground/90 leading-relaxed">
          Your assigned workspace tier is locked as{" "}
          <span className="font-bold underline text-primary">{role}</span>.
          Schedule modifications, service pricing bounds, and shift allocations
          can only be updated by the store owner.
        </p>
      </div>
    </div>
  );
}
