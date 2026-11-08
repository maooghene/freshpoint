"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  TriangleAlert,
  Loader2,
  X,
} from "lucide-react";
import {
  dismissToast,
  getToasts,
  subscribeToasts,
  type ToastItem,
  type ToastKind,
} from "@/lib/toast";

const KIND_STYLES: Record<
  ToastKind,
  { icon: React.ElementType; ring: string; iconWrap: string; bar: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: "border-emerald-500/25",
    iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    label: "Success",
  },
  error: {
    icon: XCircle,
    ring: "border-rose-500/25",
    iconWrap: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    label: "Error",
  },
  warning: {
    icon: TriangleAlert,
    ring: "border-amber-500/30",
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    label: "Heads up",
  },
  info: {
    icon: Info,
    ring: "border-sky-500/25",
    iconWrap: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    bar: "bg-sky-500",
    label: "Info",
  },
  loading: {
    icon: Loader2,
    ring: "border-border",
    iconWrap: "bg-muted text-muted-foreground",
    bar: "bg-primary",
    label: "Working",
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const [paused, setPaused] = React.useState(false);
  const [remaining, setRemaining] = React.useState(item.duration);
  const startedAt = React.useRef<number>(0);
  const style = KIND_STYLES[item.kind];
  const Icon = style.icon;

  // Restart the countdown when the toast changes (e.g. loading -> success).
  React.useEffect(() => {
    setRemaining(item.duration);
    startedAt.current = Date.now();
  }, [item.kind, item.duration]);

  React.useEffect(() => {
    if (item.duration === 0 || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismissToast(item.id), remaining);
    return () => {
      clearTimeout(timer);
      setRemaining((r) => Math.max(0, r - (Date.now() - startedAt.current)));
    };
  }, [paused, item.id, item.duration, item.kind]);

  return (
    <div
      role={item.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${style.ring} bg-card/95 text-card-foreground shadow-lg shadow-black/10 backdrop-blur animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className="flex items-start gap-3 p-3.5 pr-10">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}
        >
          <Icon
            className={`h-4.5 w-4.5 ${item.kind === "loading" ? "animate-spin" : ""}`}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {style.label}
          </p>
          <div className="text-sm font-medium leading-snug text-foreground break-words">
            {item.content}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      {item.duration > 0 && (
        <div className="h-0.5 w-full bg-transparent">
          <div
            key={`${item.id}-${item.kind}`}
            className={`h-full ${style.bar} origin-left`}
            style={{
              animation: `fp-toast-progress ${item.duration}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastProvider() {
  const toasts = React.useSyncExternalStore(
    subscribeToasts,
    getToasts,
    () => [] as ToastItem[],
  );

  return (
    <>
      <style>{`@keyframes fp-toast-progress{from{transform:scaleX(1)}to{transform:scaleX(0)}}`}</style>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[999999] mx-auto flex w-full max-w-sm flex-col gap-2 px-3 sm:left-auto sm:right-4 sm:top-4 sm:mx-0 sm:px-0"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
