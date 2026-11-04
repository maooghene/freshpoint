"use client";

import { useEffect, useState } from "react";
import { Clock, Tag } from "lucide-react";

interface PromoBannerProps {
  title: string;
  details: string | null;
  /** ISO timestamp when the offer ends. */
  endsAt: string;
  /** Called once the countdown reaches zero so the page can remove it. */
  onExpired: () => void;
}

function breakDown(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Storefront offer banner with a live countdown. It cannot be dismissed: it
 * stays until the offer ends, then removes itself.
 */
export function PromoBanner({ title, details, endsAt, onExpired }: PromoBannerProps) {
  const endTime = new Date(endsAt).getTime();
  const [msLeft, setMsLeft] = useState(() => endTime - Date.now());

  useEffect(() => {
    const tick = () => {
      const left = endTime - Date.now();
      setMsLeft(left);
      if (left <= 0) onExpired();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endTime, onExpired]);

  if (msLeft <= 0) return null;

  const { days, hours, minutes, seconds } = breakDown(msLeft);
  const units: [number, string][] = [
    ...(days > 0 ? ([[days, "d"]] as [number, string][]) : []),
    [hours, "h"],
    [minutes, "m"],
    [seconds, "s"],
  ];

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Tag className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight text-foreground">{title}</p>
          {details && (
            <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-line">
              {details}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-2"
        aria-label={`Offer ends in ${days} days ${hours} hours ${minutes} minutes`}
      >
        <Clock className="size-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Ends in
        </span>
        <div className="flex gap-1.5 tabular-nums">
          {units.map(([value, label]) => (
            <span
              key={label}
              className="min-w-10 rounded-lg bg-background px-2 py-1 text-center text-sm font-black text-foreground shadow-sm"
            >
              {String(value).padStart(2, "0")}
              <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
