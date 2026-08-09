// lib/subscription-tiers.ts
import { SubscriptionTier } from "@prisma/client";

export const TIER_COMMISSION_RATES: Record<SubscriptionTier, number> = {
  STARTER: 0.1, // 10% — no commitment, no subscription fee
  GROWTH: 0.08, // 8% — mid-tier subscription
  PRO: 0.05, // 5% — top tier, rewards volume/loyalty
};

export function getCommissionRateForTier(tier: SubscriptionTier): number {
  return TIER_COMMISSION_RATES[tier];
}
