import type { SubscriptionTier } from "@prisma/client";
// Commission rates per tier (e.g. 0.10 = 10%, 0.05 = 5%)
export const TIER_COMMISSION_RATES: Record<SubscriptionTier, number> = {
  STARTER: 0.1, // 10% standard rate
  GROWTH: 0.07, // 7% reduced rate
  PRO: 0.05, // 5% lowest rate
};
export function getCommissionRateForTier(tier: SubscriptionTier): number {
  return TIER_COMMISSION_RATES[tier];
}
// Default delivery radius (km) per tier when the business hasn't set a
// custom value. Only Pro can override this via deliveryRadiusKm.
export const TIER_DEFAULT_DELIVERY_RADIUS_KM: Record<SubscriptionTier, number> =
  {
    STARTER: 10,
    GROWTH: 10,
    PRO: 10,
  };
export const CUSTOM_DELIVERY_RADIUS_TIERS: SubscriptionTier[] = ["PRO"];
export function canCustomizeDeliveryRadius(tier: SubscriptionTier): boolean {
  return CUSTOM_DELIVERY_RADIUS_TIERS.includes(tier);
}
export function getEffectiveDeliveryRadiusKm(
  tier: SubscriptionTier,
  customRadiusKm: number | null,
): number {
  if (canCustomizeDeliveryRadius(tier) && customRadiusKm != null) {
    return customRadiusKm;
  }
  return TIER_DEFAULT_DELIVERY_RADIUS_KM[tier];
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
// Explore-page sort rank: lower = shown first. Pro ranks above Growth,
// which ranks above Starter.
export const TIER_SORT_RANK: Record<SubscriptionTier, number> = {
  PRO: 0,
  GROWTH: 1,
  STARTER: 2,
};
export const FEATURED_TIERS: SubscriptionTier[] = ["GROWTH", "PRO"];
export function isFeaturedTier(tier: SubscriptionTier): boolean {
  return FEATURED_TIERS.includes(tier);
}
export function compareTierRank(
  a: SubscriptionTier,
  b: SubscriptionTier,
): number {
  return TIER_SORT_RANK[a] - TIER_SORT_RANK[b];
}


