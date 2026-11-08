// lib/actions/admin-settings.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";
import { z } from "zod";
import { clearPlatformRulesCache } from "@/lib/platform-rules";

export interface MasterConfigValues {
  minGlobalDeliveryFee: number;
  platformPayoutFloor: number;
  maintenanceModeActive: boolean;
  allowNewRegistrations: boolean;
  enforceInstantApproval: boolean;
  maxDailyBookingsPerUser: number;
  maxDistanceLimitKm: number;
  // NEW PAYSTACK AND CASH LEVER FIELDS Added
  payoutHoldingPeriodDays: number;
  absorbPaystackFees: boolean;
  globalAlertBannerText: string | null;
}

const settingsSchema = z.object({
  minGlobalDeliveryFee: z.number().finite().min(0).max(1_000_000),
  platformPayoutFloor: z.number().finite().min(0).max(100_000_000),
  maintenanceModeActive: z.boolean(),
  allowNewRegistrations: z.boolean(),
  enforceInstantApproval: z.boolean(),
  maxDailyBookingsPerUser: z.number().int().min(1).max(1000),
  maxDistanceLimitKm: z.number().finite().min(0.1).max(500),
  payoutHoldingPeriodDays: z
    .number()
    .int("Payout holding days must be a whole number.")
    .min(0, "Payout holding days cannot be a negative number.")
    .max(90),
  absorbPaystackFees: z.boolean(),
  globalAlertBannerText: z
    .string()
    .trim()
    .max(300, "Alert banner text must be 300 characters or fewer.")
    .nullable()
    .transform((v) => (v ? v : null)),
});

export async function getSystemSettings(): Promise<MasterConfigValues> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    throw new Error("Access Denied. Administrative credentials required.");
  }

  const settings = await prisma.systemSetting.findUnique({
    where: { id: "singleton" },
  });

  return {
    minGlobalDeliveryFee: settings?.minGlobalDeliveryFee ?? 200,
    platformPayoutFloor: settings?.platformPayoutFloor ?? 2000,
    maintenanceModeActive: settings?.maintenanceModeActive ?? false,
    allowNewRegistrations: settings?.allowNewRegistrations ?? true,
    enforceInstantApproval: settings?.enforceInstantApproval ?? true,
    maxDailyBookingsPerUser: settings?.maxDailyBookingsPerUser ?? 5,
    maxDistanceLimitKm: settings?.maxDistanceLimitKm ?? 35.0,
    // Safely mapping fallback defaults
    payoutHoldingPeriodDays: settings?.payoutHoldingPeriodDays ?? 3,
    absorbPaystackFees: settings?.absorbPaystackFees ?? false,
    globalAlertBannerText: settings?.globalAlertBannerText ?? null,
  };
}

export async function updateSystemSettingsAction(
  values: MasterConfigValues,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return {
      success: false,
      message: "Unauthorized mutation request blocked.",
    };
  }

  // Parse instead of spreading the argument into Prisma: only these known
  // fields are ever written, each within a sane range.
  const parsedValues = settingsSchema.safeParse(values);
  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]?.message ?? "Invalid settings values.",
    };
  }
  const safeValues = parsedValues.data;

  try {
    await prisma.systemSetting.upsert({
      where: { id: "singleton" },
      update: safeValues,
      create: { id: "singleton", ...safeValues },
    });

    clearPlatformRulesCache();
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return {
      success: true,
      message:
        "Master operational rules updated across the platform successfully.",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database Error";
    return {
      success: false,
      message: `Failed to persist platform modifications: ${errorMsg}`,
    };
  }
}

/**
 * Public action so client components can read the emergency text banner safely.
 * Accessible to any customer visiting the home page.
 */
export async function getPublicAlertBannerText(): Promise<string | null> {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "singleton" },
      select: { globalAlertBannerText: true },
    });
    return settings?.globalAlertBannerText ?? null;
  } catch (error) {
    console.error("Failed to read public announcement text:", error);
    return null;
  }
}
