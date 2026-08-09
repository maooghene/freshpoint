"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downgradeToStarter } from "./actions";
import type { SubscriptionTier } from "@prisma/client";

interface SubscriptionTierCardProps {
  businessId: string;
  tier: SubscriptionTier;
  label: string;
  price: string;
  commissionRate: number;
  features: string[];
  isCurrent: boolean;
}

export function SubscriptionTierCard({
  businessId,
  tier,
  label,
  price,
  commissionRate,
  features,
  isCurrent,
}: SubscriptionTierCardProps) {
  const params = useParams<{ slug: string }>();
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSelect = () => {
    if (tier === "STARTER") {
      startTransition(async () => {
        const result = await downgradeToStarter(businessId, params.slug);
        if (result.success) {
          toast.success("Switched to Starter plan");
        } else {
          toast.error(result.error || "Failed to update plan");
        }
      });
      return;
    }

    // GROWTH or PRO — real money involved, route through Paystack Checkout.
    // The DB only updates once the webhook confirms payment, so we don't
    // touch subscriptionTier here at all.
    setIsRedirecting(true);
    (async () => {
      try {
        const res = await fetch("/api/subscriptions/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, tier, slug: params.slug }),
        });
        const data = await res.json();

        if (!res.ok || !data.authorizationUrl) {
          toast.error(data.error || "Could not start checkout");
          setIsRedirecting(false);
          return;
        }

        window.location.href = data.authorizationUrl;
      } catch {
        toast.error("Could not start checkout");
        setIsRedirecting(false);
      }
    })();
  };

  const isPro = tier === "PRO";
  const isBusy = isPending || isRedirecting;

  return (
    <div
      className={`relative rounded-3xl border p-6 flex flex-col transition-colors ${
        isCurrent
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card"
      }`}
    >
      {isPro && (
        <div className="absolute -top-3 left-6 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
          <CrownIcon size={12} />
          Best Value
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground">{label}</h3>
      <p className="text-2xl font-black text-foreground mt-1">{price}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {Math.round(commissionRate * 100)}% commission per transaction
      </p>

      <ul className="mt-6 space-y-2.5 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CheckIcon size={16} className="text-primary shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleSelect}
        disabled={isCurrent || isBusy}
        variant={isCurrent ? "outline" : "default"}
        className="w-full mt-6 rounded-2xl font-bold"
      >
        {isCurrent
          ? "Current Plan"
          : isBusy
            ? "Redirecting..."
            : `Switch to ${label}`}
      </Button>
    </div>
  );
}
