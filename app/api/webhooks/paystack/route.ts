import { z } from "zod";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPaystackWebhookSignature,
  tierFromPlanCode,
  disablePaystackSubscription,
  SUBSCRIPTION_PLANS,
  type PaidSubscriptionTier,
} from "@/lib/paystack";
import { applyTier } from "@/lib/subscription-service";

interface PaystackRefundEventData {
  id: number;
  status: string;
}

interface PaystackChargeEventData {
  id?: number;
  reference: string;
  amount: number;
  plan?: { plan_code?: string } | string | null;
  customer: { customer_code: string; email: string };
  metadata?: {
    type?: string;
    businessId?: string;
    tier?: string;
  };
}

interface PaystackSubscriptionEventData {
  subscription_code: string;
  email_token: string;
  next_payment_date?: string | null;
  customer: { customer_code: string };
  plan: { plan_code: string };
}

interface PaystackWebhookEvent {
  event: string;
  data: PaystackRefundEventData &
    Partial<PaystackChargeEventData> &
    Partial<PaystackSubscriptionEventData>;
}

const REFUND_STATUS_BY_EVENT: Record<string, string> = {
  "refund.pending": "pending",
  "refund.processing": "processing",
  "refund.processed": "processed",
  "refund.failed": "failed",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * DAY_MS;

function planCodeOf(plan: PaystackChargeEventData["plan"]): string | null {
  if (!plan) return null;
  if (typeof plan === "string") return plan;
  return plan.plan_code ?? null;
}

// ── Event handlers ──────────────────────────────────────────────────────
// Handlers THROW on failure. The route turns that into a 500 and removes the
// dedupe marker, so Paystack's retry is processed instead of being skipped.

async function handleRefundEvent(event: PaystackWebhookEvent, status: string) {
  const refundId = event.data?.id;
  if (typeof refundId !== "number") return;

  const updated = await prisma.order.updateMany({
    where: { paystackRefundId: refundId },
    data: { refundStatus: status },
  });

  if (updated.count === 0) {
    console.warn(
      `⚠️ [FreshPoint Webhook] No order matched Paystack refund ID ${refundId} for event "${event.event}"`,
    );
  } else {
    console.log(
      `📦 [FreshPoint Webhook] Refund ${refundId} → "${status}" (${updated.count} order updated)`,
    );
  }
}

/** First successful charge of a subscription checkout (carries our metadata). */
async function handleInitialSubscriptionCharge(data: PaystackChargeEventData) {
  const businessId = data.metadata?.businessId;
  const tier = data.metadata?.tier;
  if (!businessId || (tier !== "GROWTH" && tier !== "PRO")) {
    console.warn(
      "⚠️ [FreshPoint Webhook] subscription_tier_change charge with invalid metadata — ignored.",
    );
    return;
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { paystackSubscriptionCode: true, paystackEmailToken: true },
  });
  if (!business) {
    console.warn(
      `⚠️ [FreshPoint Webhook] Upgrade charge for unknown business ${businessId} — ignored.`,
    );
    return;
  }

  // Switching plans: stop the previous recurring subscription so the customer
  // is not billed for both. Best effort — the payment has already been taken,
  // so the upgrade still applies, and a failure is logged for manual cleanup.
  if (business.paystackSubscriptionCode && business.paystackEmailToken) {
    const cancelled = await disablePaystackSubscription(
      business.paystackSubscriptionCode,
      business.paystackEmailToken,
    );
    if (!cancelled) {
      console.error(
        `🚨 [FreshPoint Webhook] Could not cancel previous subscription ${business.paystackSubscriptionCode} for business ${businessId}. Cancel it manually in Paystack.`,
      );
    }
  }

  // Tier, expiry, customer code and limits are written in ONE transaction.
  await applyTier(businessId, tier, undefined, {
    expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    paystackCustomerCode: data.customer?.customer_code ?? null,
    clearPaystackSubscription: true,
  });
  console.log(
    `💳 [FreshPoint Webhook] Business ${businessId} upgraded to ${tier} (initial charge).`,
  );
}

/** Recurring renewal charge. Paystack does not repeat our metadata here. */
async function handleRenewalCharge(data: PaystackChargeEventData) {
  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;

  // A customer code is per email, so one owner with several businesses shares
  // it. The business whose expiry is nearest is the one that is due to renew.
  const candidates = await prisma.business.findMany({
    where: { paystackCustomerCode: customerCode },
    select: {
      id: true,
      subscriptionTier: true,
      paystackSubscriptionCode: true,
    },
    orderBy: { subscriptionExpiresAt: { sort: "asc", nulls: "last" } },
  });

  // Order and booking payments also arrive as charge.success. Only a charge
  // that belongs to one of OUR subscription plans can renew a subscription.
  let planTier = tierFromPlanCode(planCodeOf(data.plan));

  // Safety net in case Paystack omits the plan on a renewal charge: accept a
  // charge whose amount is exactly the plan price of a business that holds a
  // live subscription, so a paying customer is never left to expire.
  if (!planTier) {
    const byAmount = candidates.find(
      (b) =>
        b.subscriptionTier !== "STARTER" &&
        Boolean(b.paystackSubscriptionCode) &&
        SUBSCRIPTION_PLANS[b.subscriptionTier as PaidSubscriptionTier]
          .amountKobo === data.amount,
    );
    planTier = byAmount
      ? (byAmount.subscriptionTier as PaidSubscriptionTier)
      : null;
  }
  if (!planTier) return;

  const sameTier = candidates.find((b) => b.subscriptionTier === planTier);
  if (sameTier) {
    await prisma.business.update({
      where: { id: sameTier.id },
      data: { subscriptionExpiresAt: new Date(Date.now() + THIRTY_DAYS_MS) },
    });
    console.log(
      `🔁 [FreshPoint Webhook] Business ${sameTier.id} subscription renewed (${planTier}).`,
    );
    return;
  }

  // A paying customer that was moved to Starter while their Paystack
  // subscription is still live (it still holds a subscription code) gets their
  // plan back. Staff and locations that were deactivated stay deactivated.
  const wronglyDowngraded = candidates.find(
    (b) => b.subscriptionTier === "STARTER" && b.paystackSubscriptionCode,
  );
  if (wronglyDowngraded) {
    await applyTier(wronglyDowngraded.id, planTier, undefined, {
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    });
    console.warn(
      `♻️ [FreshPoint Webhook] Business ${wronglyDowngraded.id} was on Starter but renewed ${planTier} — plan restored.`,
    );
    return;
  }

  console.warn(
    `⚠️ [FreshPoint Webhook] Renewal charge for customer ${customerCode} matched no business.`,
  );
}

/** Fired once after the first charge — gives us the code + token to cancel later. */
async function handleSubscriptionCreate(data: PaystackSubscriptionEventData) {
  const customerCode = data.customer?.customer_code;
  if (!customerCode || !data.subscription_code) return;

  const planTier = tierFromPlanCode(data.plan?.plan_code);

  // Attach to the business that was just upgraded on this plan and does not
  // have a subscription yet. The most recent upgrade has the latest expiry.
  const [target] = await prisma.business.findMany({
    where: {
      paystackCustomerCode: customerCode,
      paystackSubscriptionCode: null,
      ...(planTier ? { subscriptionTier: planTier } : {}),
    },
    select: { id: true },
    orderBy: { subscriptionExpiresAt: { sort: "desc", nulls: "last" } },
    take: 1,
  });

  if (!target) {
    // This event can arrive before charge.success has been processed. Throwing
    // makes Paystack retry later, when the business has been upgraded.
    throw new Error(
      `subscription.create: no business ready for customer ${customerCode}`,
    );
  }

  const next = data.next_payment_date ? new Date(data.next_payment_date) : null;
  const nextIsSane =
    next !== null &&
    !Number.isNaN(next.getTime()) &&
    next.getTime() > Date.now() &&
    next.getTime() < Date.now() + 40 * DAY_MS;

  await prisma.business.update({
    where: { id: target.id },
    data: {
      paystackSubscriptionCode: data.subscription_code,
      paystackEmailToken: data.email_token,
      ...(nextIsSane ? { subscriptionExpiresAt: next } : {}),
    },
  });
  console.log(
    `📋 [FreshPoint Webhook] Stored subscription_code for business ${target.id}.`,
  );
}

/**
 * Subscription cancelled — by us, by the owner, or by Paystack after failed
 * renewals. The paid period already covers access until subscriptionExpiresAt,
 * and the expiry job ends it, so only the cancel credentials are cleared here.
 */
async function handleSubscriptionDisable(data: PaystackSubscriptionEventData) {
  if (!data.subscription_code) return;

  const updated = await prisma.business.updateMany({
    where: { paystackSubscriptionCode: data.subscription_code },
    data: { paystackSubscriptionCode: null, paystackEmailToken: null },
  });

  if (updated.count > 0) {
    console.log(
      `ℹ️ [FreshPoint Webhook] Subscription ${data.subscription_code} disabled; plan ends at its expiry date.`,
    );
  }
}

async function handleEvent(event: PaystackWebhookEvent): Promise<void> {
  const refundStatus = REFUND_STATUS_BY_EVENT[event.event];
  if (refundStatus) {
    await handleRefundEvent(event, refundStatus);
    return;
  }

  switch (event.event) {
    case "charge.success": {
      const data = event.data as PaystackChargeEventData;
      if (data.metadata?.type === "subscription_tier_change") {
        await handleInitialSubscriptionCharge(data);
      } else {
        await handleRenewalCharge(data);
      }
      return;
    }
    case "subscription.create":
      await handleSubscriptionCreate(
        event.data as PaystackSubscriptionEventData,
      );
      return;
    case "subscription.disable":
      await handleSubscriptionDisable(
        event.data as PaystackSubscriptionEventData,
      );
      return;
    case "invoice.payment_failed": {
      // Paystack retries on its own schedule. If it gives up it cancels the
      // subscription and the plan ends at its expiry date, so nothing to write.
      const data = event.data as PaystackSubscriptionEventData;
      console.warn(
        `⚠️ [FreshPoint Webhook] Renewal payment failed for customer ${data.customer?.customer_code ?? "unknown"}.`,
      );
      return;
    }
    default:
      console.log(
        `ℹ️ [FreshPoint Webhook] Ignoring unhandled event: ${event.event}`,
      );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Must read as raw text BEFORE parsing — signature is computed over the
  // exact bytes Paystack sent, and re-serializing parsed JSON can produce
  // a different byte sequence (key order, spacing) that fails verification.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.warn(
      "🔒 [FreshPoint Webhook] Rejected Paystack event: signature mismatch",
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PaystackWebhookEvent;
  try {
    const envelope = z
      .object({
        event: z.string().min(1).max(100),
        data: z.record(z.string(), z.unknown()),
      })
      .parse(JSON.parse(rawBody));
    event = envelope as unknown as PaystackWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const charge = event.data as Partial<PaystackChargeEventData>;
  const subscription = event.data as Partial<PaystackSubscriptionEventData>;
  const eventIdentity =
    typeof event.data?.id === "number"
      ? String(event.data.id)
      : charge.reference ||
        subscription.subscription_code ||
        createHash("sha256").update(rawBody).digest("hex");

  // Idempotency: the unique (provider, eventKey) row is the dedupe lock.
  let eventRowId: string;
  try {
    const row = await prisma.paystackWebhookEvent.create({
      data: {
        provider: "paystack",
        eventKey: `${event.event}:${eventIdentity}`,
      },
      select: { id: true },
    });
    eventRowId = row.id;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 },
      );
    }
    throw error;
  }

  try {
    await handleEvent(event);
  } catch (error) {
    // Release the lock so Paystack's retry is processed, not skipped as a
    // duplicate. Without this, one transient failure would lose the event.
    await prisma.paystackWebhookEvent
      .delete({ where: { id: eventRowId } })
      .catch((deleteError) =>
        console.error(
          "🚨 [FreshPoint Webhook] Could not release dedupe marker:",
          deleteError,
        ),
      );
    console.error(
      `🚨 [FreshPoint Webhook] Failed to process "${event.event}":`,
      error,
    );
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
