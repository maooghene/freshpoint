import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { SparklesIcon } from "lucide-react";
import SubscriptionTierCard from "./SubscriptionTierCard";
import { TIER_COMMISSION_RATES, TRIAL_DAYS } from "@/lib/subscription-tiers";
import type { SubscriptionTier } from "@prisma/client";
import { CalendarClockIcon } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const TIER_ORDER: SubscriptionTier[] = ["STARTER", "GROWTH", "PRO"];

const PLAN_PRICE_NAIRA = { GROWTH: 10_000, PRO: 20_000 } as const;

const pct = (tier: SubscriptionTier) =>
  `${Math.round(TIER_COMMISSION_RATES[tier] * 100)}%`;

// How much monthly sales through FreshPoint a plan needs to pay for itself
// compared with the plan below it, from the commission it saves.
function breakEven(price: number, rateBefore: number, rateAfter: number): string {
  const sales = Math.round(price / (rateBefore - rateAfter) / 1000) * 1000;
  return `₦${sales.toLocaleString("en-NG")}`;
}

const TIER_COPY: Record<
  SubscriptionTier,
  { label: string; price: string; features: string[]; note?: string }
> = {
  STARTER: {
    label: "Starter",
    price: "Free",
    features: [
      `${pct("STARTER")} commission on bookings and orders`,
      "1 staff account (just you)",
      "Basic totals — orders & revenue",
      "Standard booking confirmation",
      "Standard listing in Explore",
    ],
  },
  GROWTH: {
    label: "Growth",
    price: `₦${PLAN_PRICE_NAIRA.GROWTH.toLocaleString("en-NG")}/mo`,
    features: [
      `${pct("GROWTH")} commission — keep more of every sale`,
      "Unlimited staff accounts",
      "Full analytics dashboard",
      "Automatic booking reminders by email — fewer no-shows",
      "Listed above Starter shops in Explore",
    ],
    note: `Pays for itself from about ${breakEven(PLAN_PRICE_NAIRA.GROWTH, TIER_COMMISSION_RATES.STARTER, TIER_COMMISSION_RATES.GROWTH)} a month in sales through FreshPoint, compared with Starter.`,
  },
  PRO: {
    label: "Pro",
    price: `₦${PLAN_PRICE_NAIRA.PRO.toLocaleString("en-NG")}/mo`,
    features: [
      "Everything in Growth",
      `${pct("PRO")} commission — our lowest rate`,
      "Sponsored placement — shown first in Explore",
      "Timed storefront promotions with a countdown",
      "Broadcast messages to your customers",
      "Multiple locations",
      "Set your own delivery radius",
    ],
    note: `Pays for itself from about ${breakEven(PLAN_PRICE_NAIRA.PRO, TIER_COMMISSION_RATES.STARTER, TIER_COMMISSION_RATES.PRO)} a month in sales compared with Starter, before counting the extra customers Sponsored placement brings.`,
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
    include: {
      owner: true,
      // Only active staff and locations can be kept on a downgrade; inactive
      // ones are ignored by the server, so do not offer them.
      staff: { where: { isActive: true }, select: { id: true, name: true, email: true, isActive: true }, orderBy: { createdAt: "asc" } },
      locations: { where: { isActive: true }, select: { id: true, name: true, isPrimary: true, isActive: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
    },
  });

  if (!business) {
    notFound();
  }

  const systemUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  // Same guard as the dashboard and staff pages: owner, or a verified admin
  // impersonation session for this exact business. (Previously this was a raw
  // clerkId comparison that redirected to /dashboard, which doesn't exist.)
  const authorized = systemUser
    ? await authorizeBusinessAccess({
        businessId: business.id,
        ownerId: business.ownerId,
        systemUserId: systemUser.id,
        allowStaff: false,
      })
    : false;

  if (!authorized) {
    redirect("/select-workspace");
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
            . You can switch anytime — no lock-in. Paid plans renew each month
            by card.
          </p>
        </div>
      </div>

      {business.isOnTrial && business.subscriptionExpiresAt && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <CalendarClockIcon className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            You&apos;re on a free{" "}
            <span className="font-semibold text-foreground">
              {business.subscriptionTier}
            </span>{" "}
            trial until{" "}
            <span className="font-semibold text-foreground">
              {business.subscriptionExpiresAt.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            . Subscribe before then to keep your plan; otherwise your business
            moves back to Starter.
          </p>
        </div>
      )}

      {!business.isOnTrial &&
        business.subscriptionTier !== "STARTER" &&
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
            isOnTrial={business.isOnTrial && business.subscriptionTier === tier}
            trialAvailable={
              business.subscriptionTier === "STARTER" && !business.trialUsedAt
            }
            trialDays={TRIAL_DAYS}
            note={TIER_COPY[tier].note}
            staffOptions={business.staff.map(({ id, name }) => ({ id, name }))}
            locationOptions={business.locations.map(({ id, name, isPrimary }) => ({ id, name, isPrimary }))}
          />
        ))}
      </div>
    </main>
  );
}
