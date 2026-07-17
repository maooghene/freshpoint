// lib/actions/admin-settings.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";

export interface MasterConfigValues {
  bookingCommissionPct: number;
  productCommissionPct: number;
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

export async function getSystemSettings(): Promise<MasterConfigValues> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    throw new Error("Access Denied. Administrative credentials required.");
  }

  const settings = await prisma.systemSetting.findUnique({
    where: { id: "singleton" },
  });

  return {
    bookingCommissionPct: settings?.bookingCommissionPct ?? 8,
    productCommissionPct: settings?.productCommissionPct ?? 5,
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

  if (
    values.bookingCommissionPct < 0 ||
    values.bookingCommissionPct > 100 ||
    values.productCommissionPct < 0 ||
    values.productCommissionPct > 100
  ) {
    return {
      success: false,
      message: "Commission thresholds must remain within 0-100 ranges.",
    };
  }

  if (values.payoutHoldingPeriodDays < 0) {
    return {
      success: false,
      message: "Payout holding days cannot be a negative number.",
    };
  }

  try {
    await prisma.systemSetting.upsert({
      where: { id: "singleton" },
      update: { ...values },
      create: { id: "singleton", ...values },
    });

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
