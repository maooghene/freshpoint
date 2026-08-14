import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SparklesIcon } from "lucide-react";
import SubscriptionTierCard from "./SubscriptionTierCard";
import {
  TIER_COMMISSION_RATES,
  TIER_DEFAULT_DELIVERY_RADIUS_KM,
} from "@/lib/subscription-tiers";
import type { SubscriptionTier } from "@prisma/client";
import { CalendarClockIcon } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const TIER_ORDER: SubscriptionTier[] = ["STARTER", "GROWTH", "PRO"];

// Fixed the syntax error by changing 'Record' to 'Record<'
const TIER_COPY: Record<
  SubscriptionTier,
  { label: string; price: string; features: string[] }
> = {
  STARTER: {
    label: "Starter",
    price: "Free",
    features: [
      "1 staff account (just you)",
      "Basic totals — orders & revenue",
      "Standard booking confirmation",
      "Normal listing placement",
      `${TIER_DEFAULT_DELIVERY_RADIUS_KM.STARTER}km fixed delivery radius`,
    ],
  },
  GROWTH: {
    label: "Growth",
    price: "₦5,000/mo",
    features: [
      "Unlimited staff accounts",
      "Full analytics dashboard",
      "Automated booking reminders",
      "Featured placement badge",
      `${TIER_DEFAULT_DELIVERY_RADIUS_KM.GROWTH}km fixed delivery radius`,
    ],
  },
  PRO: {
    label: "Pro",
    price: "₦15,000/mo",
    features: [
      "Everything in Growth",
      "Top featured placement",
      "Promotional broadcast messages",
      "Customizable delivery radius — set your own reach",
      "Lowest commission rate",
    ],
  },
};

export default async function SubscriptionPage({ params }: PageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { owner: true },
  });

  if (!business) {
    notFound();
  }

  if (business.owner.clerkId !== userId) {
    redirect("/dashboard");
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl min-h-screen text-foreground transition-colors duration-200">
      <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
        <div className="rounded-xl bg-muted border border-border p-3 shrink-0 flex items-center justify-center">
          <SparklesIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Subscription Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Choose the plan that fits{" "}
            <span className="font-bold text-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-md text-xs font-mono">
              {business.slug}
            </span>
            . You can switch anytime — no lock-in.
          </p>
        </div>
      </div>

      {business.subscriptionTier !== "STARTER" &&
        business.subscriptionExpiresAt &&
        (() => {
          const isOverdue = business.subscriptionExpiresAt < new Date();
          return (
            <div
              className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                isOverdue
                  ? "border-destructive/40 bg-destructive/10"
                  : "border-border bg-muted/50"
              }`}
            >
              <CalendarClockIcon
                className={`h-5 w-5 shrink-0 ${
                  isOverdue ? "text-destructive" : "text-primary"
                }`}
              />
              <p
                className={`text-sm ${
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {isOverdue ? (
                  <>
                    Your{" "}
                    <span className="font-semibold">
                      {business.subscriptionTier}
                    </span>{" "}
                    plan renewal is overdue — payment on{" "}
                    <span className="font-semibold">
                      {business.subscriptionExpiresAt.toLocaleDateString(
                        "en-NG",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>{" "}
                    may have failed. If this doesn&apos;t resolve soon, your
                    account will be moved to Starter.
                  </>
                ) : (
                  <>
                    Your{" "}
                    <span className="font-semibold text-foreground">
                      {business.subscriptionTier}
                    </span>{" "}
                    plan renews on{" "}
                    <span className="font-semibold text-foreground">
                      {business.subscriptionExpiresAt.toLocaleDateString(
                        "en-NG",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          );
        })()}

      <div className="grid gap-6 md:grid-cols-3">
        {TIER_ORDER.map((tier) => (
          <SubscriptionTierCard
            key={tier}
            businessId={business.id}
            slug={business.slug}
            tier={tier}
            label={TIER_COPY[tier].label}
            price={TIER_COPY[tier].price}
            commissionRate={TIER_COMMISSION_RATES[tier]}
            features={TIER_COPY[tier].features}
            isCurrent={business.subscriptionTier === tier}
          />
        ))}
      </div>
    </main>
  );
}
