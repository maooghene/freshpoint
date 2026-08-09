"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { disablePaystackSubscription } from "@/lib/paystack";
import { getCommissionRateForTier } from "@/lib/subscription-tiers";

/**
 * Downgrading to Starter is free and instant — no payment involved.
 * If the business had an active paid subscription, we also cancel it on
 * Paystack's side so they stop being billed going forward.
 */
export async function downgradeToStarter(businessId: string, slug: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      paystackSubscriptionCode: true,
      paystackEmailToken: true,
      owner: { select: { clerkId: true } },
    },
  });

  if (!business || business.owner.clerkId !== userId) {
    return { success: false, error: "Forbidden" };
  }

  if (business.paystackSubscriptionCode && business.paystackEmailToken) {
    const cancelled = await disablePaystackSubscription(
      business.paystackSubscriptionCode,
      business.paystackEmailToken,
    );
    if (!cancelled) {
      console.error(
        `⚠️ Failed to cancel Paystack subscription for business ${businessId} during downgrade — proceeding with local downgrade anyway.`,
      );
    }
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionTier: "STARTER",
      commissionRate: getCommissionRateForTier("STARTER" as any),
      paystackSubscriptionCode: null,
      paystackEmailToken: null,
    },
  });

  revalidatePath(`/business/${slug}/subscription`);
  return { success: true };
}
