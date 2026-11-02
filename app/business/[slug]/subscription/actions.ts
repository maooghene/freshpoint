"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { disablePaystackSubscription } from "@/lib/paystack";
import { applyTier } from "@/lib/subscription-service";

/**
 * Downgrading to Starter is free and instant — no payment involved.
 * If the business had an active paid subscription, we also cancel it on
 * Paystack's side so they stop being billed going forward.
 */
export async function downgradeToStarter(
  businessId: string,
  slug: string,
  timing: "now" | "period_end",
  selection?: { staffIds?: string[]; locationIds?: string[] },
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const systemUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!systemUser) {
    return { success: false, error: "Unauthorized" };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      ownerId: true,
      paystackSubscriptionCode: true,
      paystackEmailToken: true,
    },
  });

  if (!business || business.ownerId !== systemUser.id) {
    return { success: false, error: "Forbidden" };
  }

  const hasPaystackSubscription = Boolean(
    business.paystackSubscriptionCode && business.paystackEmailToken,
  );

  if (hasPaystackSubscription) {
    const cancelled = await disablePaystackSubscription(
      business.paystackSubscriptionCode!,
      business.paystackEmailToken!,
    );
    if (!cancelled && timing === "period_end") {
      return {
        success: false,
        error: "Could not stop recurring billing. Please try again.",
      };
    }
  }

  if (timing === "now") {
    await applyTier(businessId, "STARTER", selection);
    await prisma.business.update({
      where: { id: businessId },
      data: { paystackSubscriptionCode: null, paystackEmailToken: null },
    });
  } else {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        downgradeStaffIds: selection?.staffIds ?? [],
        downgradeLocationIds: selection?.locationIds ?? [],
      },
    });
  }
  // At period end the paid tier remains active until subscriptionExpiresAt;
  // the expiry job then applies Starter centrally.

  revalidatePath(`/business/${slug}/subscription`);
  return { success: true };
}
