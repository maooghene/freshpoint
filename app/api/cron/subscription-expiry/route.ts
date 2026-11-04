import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { disablePaystackSubscription } from "@/lib/paystack";
import { downgradeIfExpired } from "@/lib/subscription-service";
import { escapeHtml } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Paystack bills monthly plans on the same calendar day, so cycles run 28–31
// days, and a renewal webhook can arrive late. The grace period stops a paying
// customer from being downgraded in the gap before their renewal lands.
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

function hasValidCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const given = Buffer.from(token);
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - GRACE_PERIOD_MS);
  const expired = await prisma.business.findMany({
    where: {
      subscriptionTier: { in: ["GROWTH", "PRO"] },
      // Paid plans get a grace period; free trials end exactly on time.
      OR: [
        { isOnTrial: false, subscriptionExpiresAt: { lte: cutoff } },
        { isOnTrial: true, subscriptionExpiresAt: { lte: now } },
      ],
    },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      isOnTrial: true,
      paystackSubscriptionCode: true,
      paystackEmailToken: true,
      owner: { select: { email: true } },
    },
    take: 100,
  });

  let downgraded = 0;
  let emailsSent = 0;
  let failed = 0;
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  for (const business of expired) {
    try {
      // Claim + downgrade + limit enforcement run in one transaction. If it
      // throws, nothing is changed and the business is retried on the next run.
      const previousTier = await downgradeIfExpired(
        business.id,
        business.isOnTrial ? now : cutoff,
      );
      if (!previousTier) continue;
      downgraded++;

      // Make sure Paystack stops billing. The stored credentials are only
      // cleared once the cancel succeeds, so a failure can be retried or
      // cancelled by hand instead of billing a customer with no way to stop it.
      if (business.paystackSubscriptionCode && business.paystackEmailToken) {
        const cancelled = await disablePaystackSubscription(
          business.paystackSubscriptionCode,
          business.paystackEmailToken,
        );
        if (cancelled) {
          await prisma.business.update({
            where: { id: business.id },
            data: { paystackSubscriptionCode: null, paystackEmailToken: null },
          });
        } else {
          console.error(
            `🚨 [Subscription Expiry] Business ${business.id} downgraded but Paystack subscription ${business.paystackSubscriptionCode} could not be cancelled. Cancel it manually.`,
          );
        }
      }

      if (resend && business.owner.email) {
        const { error } = await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            "FreshPoint <notifications@freshpoint.com>",
          to: business.owner.email,
          subject: business.isOnTrial
            ? "Your FreshPoint free trial has ended"
            : "Your FreshPoint paid plan has expired",
          html: business.isOnTrial
            ? `<p>Your free ${previousTier} trial for <strong>${escapeHtml(business.name)}</strong> has ended and the business is now on Starter. You can subscribe any time from the subscription page to get your plan back.</p>`
            : `<p>Your ${previousTier} plan for <strong>${escapeHtml(business.name)}</strong> has ended. The business is now on Starter. You can choose a paid plan again from the subscription page.</p>`,
        });
        if (error) {
          console.error("SUBSCRIPTION_EXPIRY_EMAIL_ERROR", error);
        } else {
          emailsSent++;
        }
      }
    } catch (error) {
      failed++;
      console.error(
        `SUBSCRIPTION_EXPIRY_ERROR for business ${business.id}:`,
        error,
      );
    }
  }

  return NextResponse.json({ downgraded, emailsSent, failed });
}
