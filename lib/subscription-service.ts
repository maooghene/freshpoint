import type { Prisma, SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCommissionRateForTier,
  getMaxLocationsForTier,
  getStaffLimitForTier,
} from "@/lib/subscription-tiers";

interface TierSelection {
  staffIds?: string[];
  locationIds?: string[];
}

interface ApplyTierOptions {
  /** Explicit expiry for a paid tier. Omit to leave it unchanged. Starter always clears it. */
  expiresAt?: Date | null;
  /** Paystack customer code to store (set on the initial upgrade charge). */
  paystackCustomerCode?: string | null;
  /** Clear the stored Paystack subscription code and token. */
  clearPaystackSubscription?: boolean;
}

type Tx = Prisma.TransactionClient;

async function applyTierInTx(
  tx: Tx,
  businessId: string,
  tier: SubscriptionTier,
  selection: TierSelection | undefined,
  options: ApplyTierOptions,
): Promise<void> {
  await tx.business.update({
    where: { id: businessId },
    data: {
      subscriptionTier: tier,
      commissionRate: getCommissionRateForTier(tier),
      subscriptionExpiresAt: tier === "STARTER" ? null : options.expiresAt,
      downgradeStaffIds: selection?.staffIds ?? [],
      downgradeLocationIds: selection?.locationIds ?? [],
      ...(options.paystackCustomerCode !== undefined
        ? { paystackCustomerCode: options.paystackCustomerCode }
        : {}),
      ...(options.clearPaystackSubscription
        ? { paystackSubscriptionCode: null, paystackEmailToken: null }
        : {}),
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
    const kept = new Set(
      selectedStaffIds.length
        ? selectedStaffIds
        : staff.slice(0, staffLimit).map(({ id }) => id),
    );
    const excessIds = staff
      .filter(({ id }) => !kept.has(id))
      .map(({ id }) => id);
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
    const selectedLocationIds = validSelectedLocationIds.slice(
      0,
      locationLimit,
    );
    const keptIds = selectedLocationIds.length
      ? selectedLocationIds
      : locations.slice(0, locationLimit).map(({ id }) => id);
    const excessIds = locations
      .filter(({ id }) => !keptIds.includes(id))
      .map(({ id }) => id);
    if (excessIds.length) {
      await tx.location.updateMany({
        where: { id: { in: excessIds }, businessId },
        data: { isActive: false },
      });
    }
  }
}

/**
 * All persisted plan changes must pass through this server-side boundary.
 * Pass `client` to run inside a transaction the caller already opened.
 * Tier, commission, expiry, Paystack fields and staff/location limits are
 * written together, so a failure never leaves a half-applied plan.
 */
export async function applyTier(
  businessId: string,
  tier: SubscriptionTier,
  selection?: TierSelection,
  options: ApplyTierOptions = {},
  client?: Tx,
): Promise<void> {
  if (client) {
    await applyTierInTx(client, businessId, tier, selection, options);
    return;
  }
  await prisma.$transaction((tx) =>
    applyTierInTx(tx, businessId, tier, selection, options),
  );
}

/**
 * Downgrades one expired paid business to Starter, applying its saved
 * staff/location selections. The claim (flipping the tier) and the limit
 * enforcement happen in a single transaction, so a failure rolls both back
 * and the business is picked up again on the next run.
 * Returns the tier it had before, or null if it was not downgraded.
 */
export async function downgradeIfExpired(
  businessId: string,
  cutoff: Date,
): Promise<SubscriptionTier | null> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.business.findUnique({
      where: { id: businessId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        downgradeStaffIds: true,
        downgradeLocationIds: true,
      },
    });
    if (
      !current ||
      current.subscriptionTier === "STARTER" ||
      !current.subscriptionExpiresAt ||
      current.subscriptionExpiresAt > cutoff
    ) {
      return null;
    }

    // Atomic claim: if two runs overlap, only one flips the tier.
    const claimed = await tx.business.updateMany({
      where: {
        id: businessId,
        subscriptionTier: current.subscriptionTier,
        subscriptionExpiresAt: { lte: cutoff },
      },
      data: { subscriptionTier: "STARTER" },
    });
    if (claimed.count !== 1) return null;

    await applyTierInTx(
      tx,
      businessId,
      "STARTER",
      {
        staffIds: current.downgradeStaffIds,
        locationIds: current.downgradeLocationIds,
      },
      {},
    );
    return current.subscriptionTier;
  });
}
