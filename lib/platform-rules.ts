import { prisma } from "@/lib/prisma";

/**
 * Platform-wide rules an admin can change from Global Settings. Read by the
 * checkout, booking, registration and delivery code so the settings actually
 * take effect. Cached briefly per server instance to avoid a database read on
 * every request.
 */
export interface PlatformRules {
  minGlobalDeliveryFee: number;
  maintenanceModeActive: boolean;
  allowNewRegistrations: boolean;
  enforceInstantApproval: boolean;
  maxDailyBookingsPerUser: number;
  maxDistanceLimitKm: number;
}

export const DEFAULT_PLATFORM_RULES: PlatformRules = {
  minGlobalDeliveryFee: 200,
  maintenanceModeActive: false,
  allowNewRegistrations: true,
  enforceInstantApproval: true,
  maxDailyBookingsPerUser: 5,
  maxDistanceLimitKm: 35,
};

const CACHE_MS = 15_000;
let cached: { at: number; rules: PlatformRules } | null = null;

export async function getPlatformRules(): Promise<PlatformRules> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rules;
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { id: "singleton" },
      select: {
        minGlobalDeliveryFee: true,
        maintenanceModeActive: true,
        allowNewRegistrations: true,
        enforceInstantApproval: true,
        maxDailyBookingsPerUser: true,
        maxDistanceLimitKm: true,
      },
    });
    const rules = row ? { ...DEFAULT_PLATFORM_RULES, ...row } : DEFAULT_PLATFORM_RULES;
    cached = { at: Date.now(), rules };
    return rules;
  } catch (error) {
    // Never take the platform down because settings could not be read.
    console.error("PLATFORM_RULES_READ_FAILURE:", error);
    return cached?.rules ?? DEFAULT_PLATFORM_RULES;
  }
}

/** Drops the cache so an admin change applies immediately on this instance. */
export function clearPlatformRulesCache(): void {
  cached = null;
}

export const MAINTENANCE_MESSAGE =
  "FreshPoint is down for a short maintenance. Please try again soon.";

/** Bookings a customer has made in the last 24 hours (cancelled ones excluded). */
export async function countRecentBookings(userId: string): Promise<number> {
  return prisma.booking.count({
    where: {
      userId,
      status: { not: "CANCELLED" },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}

export function dailyBookingLimitMessage(limit: number): string {
  return `You can make up to ${limit} booking${limit === 1 ? "" : "s"} per day. Please try again tomorrow.`;
}
