"use client";
import * as React from "react";
import { useState } from "react";
import { CheckIcon, Loader2 } from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";
import { downgradeToStarter } from "./actions";

interface SubscriptionTierCardProps {
  businessId: string;
  slug: string;
  tier: SubscriptionTier;
  label: string;
  price: string;
  commissionRate: number;
  features: string[];
  isCurrent: boolean;
}

export default function SubscriptionTierCard({
  businessId,
  slug,
  tier,
  label,
  price,
  commissionRate,
  features,
  isCurrent,
}: SubscriptionTierCardProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isCurrent || isPending) return;
    setIsPending(true);

    try {
      if (tier === "STARTER") {
        const result = await downgradeToStarter(businessId, slug);
        if (!result.success) {
          alert(result.error || "Downgrade failed. Please try again.");
        }
        // downgradeToStarter revalidates the path server-side, so the
        // current-tier UI updates automatically without a manual redirect.
      } else {
        const res = await fetch("/api/subscriptions/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, tier, slug }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Could not start subscription checkout.");
          setIsPending(false);
          return;
        }

        const data: { authorizationUrl: string } = await res.json();
        window.location.href = data.authorizationUrl;
        // Intentionally leave isPending=true here — we're navigating away,
        // so no need to reset it before the redirect happens.
        return;
      }
    } catch (err) {
      console.error("SUBSCRIPTION_ACTION_ERROR:", err);
      alert("Something went wrong. Please try again.");
    }

    setIsPending(false);
  };

  return (
    <div
      className={`relative rounded-3xl border p-6 flex flex-col justify-between bg-card transition-all duration-200 ${
        isCurrent
          ? "border-primary shadow-lg ring-1 ring-primary/20"
          : "border-border/60 hover:border-border shadow-sm"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground tracking-wide uppercase">
          Current Plan
        </span>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-black tracking-tight text-foreground">
          {label}
        </h2>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {price}
          </span>
          {tier !== "STARTER" && (
            <span className="text-sm font-medium text-muted-foreground">
              /month
            </span>
          )}
        </div>
        <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {(commissionRate * 100).toFixed(0)}% Platform Commission
        </p>
      </div>

      <ul className="space-y-3.5 flex-1 mb-8">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 text-sm text-foreground/80 leading-snug"
          >
            <CheckIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleClick}
        disabled={isCurrent || isPending}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2 ${
          isCurrent
            ? "bg-muted text-muted-foreground cursor-not-allowed border border-border/40"
            : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 active:scale-[0.98]"
        }`}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isCurrent
          ? "Active"
          : isPending
            ? "Please wait..."
            : tier === "STARTER"
              ? "Downgrade"
              : "Upgrade"}
      </button>
    </div>
  );
}
