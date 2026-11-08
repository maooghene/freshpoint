import * as React from "react";
import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

interface PendingApprovalProps {
  /** "pending" = waiting for review; "suspended" = blocked by an admin. */
  variant?: "pending" | "suspended";
}

// Shown instead of the business dashboard while a store waits for an admin to
// approve it (instant approval turned off in Global Settings).
export function PendingApproval({ variant = "pending" }: PendingApprovalProps) {
  const isSuspended = variant === "suspended";
  const Icon = isSuspended ? ShieldAlert : Clock;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuspended
              ? "bg-destructive/10 text-destructive"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }`}
        >
          <Icon className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-xl font-black tracking-tight text-foreground">
          {isSuspended ? "Your store is suspended" : "Registration received"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {isSuspended
            ? "This store has been suspended by FreshPoint. If you think this is a mistake, reply to any email we sent you."
            : "Thank you for registering. Our team is reviewing your store. This usually takes 1 to 2 days. Once it is approved you can sign in and open your dashboard."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
