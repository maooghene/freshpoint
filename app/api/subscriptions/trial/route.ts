import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { applyTier } from "@/lib/subscription-service";
import { TRIAL_DAYS } from "@/lib/subscription-tiers";
import { parseJsonBody, idSchema } from "@/lib/validation";
import { auditImpersonatedAction } from "@/lib/impersonation-audit";

/**
 * Starts the one-time free trial of Growth or Pro. No card is taken. The plan
 * runs for TRIAL_DAYS, then the expiry job moves the business back to Starter
 * unless they subscribed in the meantime.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseJsonBody(
      req,
      z.object({ businessId: idSchema, tier: z.enum(["GROWTH", "PRO"]) }),
    );
    if (!parsed.ok) return parsed.response;
    const { businessId, tier } = parsed.data;

    const systemUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!systemUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        ownerId: true,
        subscriptionTier: true,
        trialUsedAt: true,
      },
    });
    const authorized = business
      ? await authorizeBusinessAccess({
          businessId,
          ownerId: business.ownerId,
          systemUserId: systemUser.id,
          allowStaff: false,
        })
      : false;
    if (!business || !authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (business.subscriptionTier !== "STARTER") {
      return NextResponse.json(
        { error: "Free trials are only available from the Starter plan." },
        { status: 400 },
      );
    }
    if (business.trialUsedAt) {
      return NextResponse.json(
        { error: "This business has already used its free trial." },
        { status: 400 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Claim the trial atomically so two clicks cannot start it twice.
    const started = await prisma.$transaction(async (tx) => {
      const claimed = await tx.business.updateMany({
        where: { id: businessId, trialUsedAt: null, subscriptionTier: "STARTER" },
        data: { trialUsedAt: now },
      });
      if (claimed.count !== 1) return false;
      await applyTier(businessId, tier, undefined, {
        expiresAt,
        isOnTrial: true,
        trialStartedAt: now,
      }, tx);
      return true;
    });

    if (!started) {
      return NextResponse.json(
        { error: "This business has already used its free trial." },
        { status: 400 },
      );
    }

    await auditImpersonatedAction({
      businessId,
      ownerId: business.ownerId,
      actorUserId: systemUser.id,
      action: "IMPERSONATED_TRIAL_STARTED",
      metadata: { tier, expiresAt: expiresAt.toISOString() },
    });

    return NextResponse.json({ success: true, tier, expiresAt });
  } catch (error: unknown) {
    console.error(
      "SUBSCRIPTION_TRIAL_ERROR:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
