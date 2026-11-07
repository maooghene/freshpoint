import type { SubscriptionTier } from "@prisma/client";
// Commission rates per tier (e.g. 0.10 = 10%, 0.05 = 5%)
export const TIER_COMMISSION_RATES: Record<SubscriptionTier, number> = {
  STARTER: 0.1, // 10% standard rate
  GROWTH: 0.07, // 7% reduced rate
  PRO: 0.05, // 5% lowest rate
};
// Free trial length for Growth and Pro. One trial per business, no card needed.
export const TRIAL_DAYS = 14;
export function getCommissionRateForTier(tier: SubscriptionTier): number {
  return TIER_COMMISSION_RATES[tier];
}
// Delivery radius is optional for every plan. A business may set its own
// radius; if it leaves it blank we only apply a generous platform-wide cap so
// straight-line fees can't grow without bound. It is not a plan feature.
export const PLATFORM_MAX_DELIVERY_RADIUS_KM = 35;
export function canCustomizeDeliveryRadius(_tier?: SubscriptionTier): boolean {
  return true;
}
export function getEffectiveDeliveryRadiusKm(
  _tier: SubscriptionTier,
  customRadiusKm: number | null,
  platformMaxKm: number = PLATFORM_MAX_DELIVERY_RADIUS_KM,
): number {
  // A business may choose a smaller radius, never a larger one than the
  // admin's platform-wide limit.
  return Math.min(customRadiusKm ?? platformMaxKm, platformMaxKm);
}
// Staff account limits per tier. null = unlimited. Starter = owner + 1
// staff account. Counts ALL StaffProfile rows (pending + active) so a
// business can't dodge the cap by leaving invites unaccepted forever.
export const TIER_STAFF_LIMITS: Record<SubscriptionTier, number | null> = {
  STARTER: 1,
  GROWTH: null,
  PRO: null,
};
export function getStaffLimitForTier(tier: SubscriptionTier): number | null {
  return TIER_STAFF_LIMITS[tier];
}
// Max Location count per tier. null = unlimited. Starter/Growth are capped
// at 1 (their auto-migrated primary location) — adding a 2nd location
// requires Pro. Pro has no ceiling. This is the real security boundary for
// multi-location: enforce this server-side in whatever action creates a
// Location, the same way canCustomizeDeliveryRadius gates the settings form
// action rather than just disabling a button in the UI.
export const TIER_MAX_LOCATIONS: Record<SubscriptionTier, number | null> = {
  STARTER: 1,
  GROWTH: 1,
  PRO: null,
};
export function getMaxLocationsForTier(tier: SubscriptionTier): number | null {
  return TIER_MAX_LOCATIONS[tier];
}
export function canAddLocation(
  tier: SubscriptionTier,
  currentLocationCount: number,
): boolean {
  const max = getMaxLocationsForTier(tier);
  if (max === null) return true;
  return currentLocationCount < max;
}

// Plan perks are enforced separately from commission, location, and staff limits.
// This mirrors the product subscription page: Starter has basic totals, while
// Growth and Pro expose the full analytics dashboard.
export const TIER_FULL_ANALYTICS: Record<SubscriptionTier, boolean> = {
  STARTER: false,
  GROWTH: true,
  PRO: true,
};
export const TIER_BOOKING_REMINDERS: Record<SubscriptionTier, boolean> = {
  STARTER: false,
  GROWTH: true,
  PRO: true,
};
export const TIER_PROMOTIONAL_BROADCASTS: Record<SubscriptionTier, boolean> = {
  STARTER: false,
  GROWTH: false,
  PRO: true,
};

export function hasFullAnalytics(tier: SubscriptionTier): boolean {
  return TIER_FULL_ANALYTICS[tier];
}
export function hasBookingReminders(tier: SubscriptionTier): boolean {
  return TIER_BOOKING_REMINDERS[tier];
}
export function hasPromotionalBroadcasts(tier: SubscriptionTier): boolean {
  return TIER_PROMOTIONAL_BROADCASTS[tier];
}
// Explore-page sort rank: lower = shown first. Pro ranks above Growth,
// which ranks above Starter.
export const TIER_SORT_RANK: Record<SubscriptionTier, number> = {
  PRO: 0,
  GROWTH: 1,
  STARTER: 2,
};
// Pro businesses appear in the "Sponsored" section at the top of Explore,
// ahead of every other result. Growth still ranks above Starter in the main
// list (see TIER_SORT_RANK). There are no tier badges.
export const SPONSORED_TIERS: SubscriptionTier[] = ["PRO"];
export function isSponsoredTier(tier: SubscriptionTier): boolean {
  return SPONSORED_TIERS.includes(tier);
}
export function compareTierRank(
  a: SubscriptionTier,
  b: SubscriptionTier,
): number {
  return TIER_SORT_RANK[a] - TIER_SORT_RANK[b];
}


