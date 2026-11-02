import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCommissionRateForTier, getMaxLocationsForTier, getStaffLimitForTier } from "@/lib/subscription-tiers";

interface TierSelection {
  staffIds?: string[];
  locationIds?: string[];
}

/** All persisted plan changes must pass through this server-side boundary. */
export async function applyTier(
  businessId: string,
  tier: SubscriptionTier,
  selection?: TierSelection,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: {
        subscriptionTier: tier,
        commissionRate: getCommissionRateForTier(tier),
        subscriptionExpiresAt: tier === "STARTER" ? null : undefined,
        downgradeStaffIds: selection?.staffIds ?? [],
        downgradeLocationIds: selection?.locationIds ?? [],
      },
    });

    const staffLimit = getStaffLimitForTier(tier);
    if (staffLimit !== null) {
      const staff = await tx.staffProfile.findMany({
        where: { businessId, isActive: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      const validSelectedStaffIds = staff
        .map(({ id }) => id)
        .filter((id) => selection?.staffIds?.includes(id));
      const selectedStaffIds = validSelectedStaffIds.slice(0, staffLimit);
      const kept = new Set(selectedStaffIds.length
        ? selectedStaffIds
        : staff.slice(0, staffLimit).map(({ id }) => id));
      const excessIds = staff.filter(({ id }) => !kept.has(id)).map(({ id }) => id);
      if (excessIds.length) {
        await tx.staffProfile.updateMany({
          where: { id: { in: excessIds }, businessId },
          data: { isActive: false },
        });
      }
    }

    const locationLimit = getMaxLocationsForTier(tier);
    if (locationLimit !== null) {
      const locations = await tx.location.findMany({
        where: { businessId, isActive: true },
        select: { id: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      });
      const validSelectedLocationIds = locations
        .map(({ id }) => id)
        .filter((id) => selection?.locationIds?.includes(id));
      const selectedLocationIds = validSelectedLocationIds.slice(0, locationLimit);
      const keptIds = selectedLocationIds.length
        ? selectedLocationIds
        : locations.slice(0, locationLimit).map(({ id }) => id);
      const excessIds = locations.filter(({ id }) => !keptIds.includes(id)).map(({ id }) => id);
      if (excessIds.length) {
        await tx.location.updateMany({
          where: { id: { in: excessIds }, businessId },
          data: { isActive: false },
        });
      }
    }
  });
}

export async function applySavedDowngradeSelections(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionTier: true, downgradeStaffIds: true, downgradeLocationIds: true },
  });
  if (!business || business.subscriptionTier === "STARTER") return;
  await applyTier(businessId, "STARTER", {
    staffIds: business.downgradeStaffIds,
    locationIds: business.downgradeLocationIds,
  });
}
