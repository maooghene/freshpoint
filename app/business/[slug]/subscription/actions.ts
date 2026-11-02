"use server";

import { auditImpersonatedAction } from "@/lib/impersonation-audit";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { disablePaystackSubscription } from "@/lib/paystack";
import { applyTier } from "@/lib/subscription-service";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

/**
 * Downgrading to Starter is free. If the business has an active paid
 * subscription, recurring billing is cancelled on Paystack first. If that
 * cancel fails we stop, so the stored subscription code and token are never
 * lost while the customer is still being billed.
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
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      paystackSubscriptionCode: true,
      paystackEmailToken: true,
    },
  });

  // Same policy as the subscription page and the checkout route:
  // the owner, or a verified admin impersonation session for this business.
  const authorized = business
    ? await authorizeBusinessAccess({
        businessId,
        ownerId: business.ownerId,
        systemUserId: systemUser.id,
        allowStaff: false,
      })
    : false;

  if (!business || !authorized) {
    return { success: false, error: "Forbidden" };
  }

  if (business.subscriptionTier === "STARTER") {
    return { success: false, error: "This business is already on Starter." };
  }

  // The expiry job only picks up businesses that have an expiry date, so a
  // paid tier with no expiry cannot wait for period end. Apply it now.
  const effectiveTiming: "now" | "period_end" =
    timing === "period_end" && !business.subscriptionExpiresAt
      ? "now"
      : timing;

  if (business.paystackSubscriptionCode && business.paystackEmailToken) {
    const cancelled = await disablePaystackSubscription(
      business.paystackSubscriptionCode,
      business.paystackEmailToken,
    );
    if (!cancelled) {
      return {
        success: false,
        error: "Could not stop recurring billing. Please try again.",
      };
    }
  }

  if (effectiveTiming === "now") {
    await applyTier(businessId, "STARTER", selection, {
      clearPaystackSubscription: true,
    });
  } else {
    // The paid tier stays active until subscriptionExpiresAt; the expiry job
    // then applies Starter using these saved selections.
    await prisma.business.update({
      where: { id: businessId },
      data: {
        downgradeStaffIds: selection?.staffIds ?? [],
        downgradeLocationIds: selection?.locationIds ?? [],
      },
    });
  }

  await auditImpersonatedAction({
    businessId,
    ownerId: business.ownerId,
    actorUserId: systemUser.id,
    action: "IMPERSONATED_PLAN_DOWNGRADE",
    metadata: {
      fromTier: business.subscriptionTier,
      requestedTiming: timing,
      appliedTiming: effectiveTiming,
    },
  });

  revalidatePath(`/business/${slug}/subscription`);
  return { success: true };
}
