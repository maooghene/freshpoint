import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPaystackWebhookSignature,
  tierFromPlanCode,
} from "@/lib/paystack";
import { getCommissionRateForTier } from "@/lib/subscription-tiers";
import type { SubscriptionTier } from "@prisma/client";

interface PaystackRefundEventData {
  id: number;
  status: string;
}

interface PaystackChargeEventData {
  reference: string;
  amount: number;
  plan?: { plan_code: string } | string | null;
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // ── Refund lifecycle (existing, unchanged) ──────────────────────────
  const mappedRefundStatus = REFUND_STATUS_BY_EVENT[event.event];
  if (mappedRefundStatus) {
    const refundId = event.data?.id;

    if (typeof refundId === "number") {
      try {
        const updated = await prisma.order.updateMany({
          where: { paystackRefundId: refundId },
          data: { refundStatus: mappedRefundStatus },
        });

        if (updated.count === 0) {
          console.warn(
            `⚠️ [FreshPoint Webhook] No order matched Paystack refund ID ${refundId} for event "${event.event}"`,
          );
        } else {
          console.log(
            `📦 [FreshPoint Webhook] Refund ${refundId} → "${mappedRefundStatus}" (${updated.count} order updated)`,
          );
        }
      } catch (err) {
        console.error(
          "🚨 [FreshPoint Webhook] Failed to persist refund status update:",
          err,
        );
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Subscription billing lifecycle (new) ────────────────────────────

  // Fired on the very FIRST successful charge for a new subscription, and
  // also on every subsequent renewal charge. We only act on the metadata
  // path for the initial tier switch; renewals are handled by matching the
  // customer_code instead, since Paystack doesn't repeat our metadata on
  // auto-renewal charges.
  if (event.event === "charge.success") {
    const data = event.data as PaystackChargeEventData;

    if (data.metadata?.type === "subscription_tier_change") {
      const { businessId, tier } = data.metadata;
      if (businessId && (tier === "GROWTH" || tier === "PRO")) {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            subscriptionTier: tier as SubscriptionTier,
            commissionRate: getCommissionRateForTier(tier as SubscriptionTier),
            subscriptionExpiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
            paystackCustomerCode: data.customer?.customer_code ?? null,
          },
        });
        console.log(
          `💳 [FreshPoint Webhook] Business ${businessId} upgraded to ${tier} (initial charge).`,
        );
      }
    } else if (data.customer?.customer_code) {
      // Likely a renewal charge — no metadata, matched by customer_code.
      const business = await prisma.business.findFirst({
        where: { paystackCustomerCode: data.customer.customer_code },
        select: { id: true, subscriptionTier: true },
      });

      if (business) {
        await prisma.business.update({
          where: { id: business.id },
          data: {
            subscriptionExpiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
          },
        });
        console.log(
          `🔁 [FreshPoint Webhook] Business ${business.id} subscription renewed (${business.subscriptionTier}).`,
        );
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Fired once, right after the first charge succeeds — gives us the
  // subscription_code + email_token we need later to cancel it.
  if (event.event === "subscription.create") {
    const data = event.data as PaystackSubscriptionEventData;
    const customerCode = data.customer?.customer_code;

    if (customerCode) {
      const updated = await prisma.business.updateMany({
        where: { paystackCustomerCode: customerCode },
        data: {
          paystackSubscriptionCode: data.subscription_code,
          paystackEmailToken: data.email_token,
        },
      });

      if (updated.count === 0) {
        console.warn(
          `⚠️ [FreshPoint Webhook] subscription.create: no business matched customer_code ${customerCode}`,
        );
      } else {
        console.log(
          `📋 [FreshPoint Webhook] Stored subscription_code for customer ${customerCode}.`,
        );
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Fired when a subscription is cancelled — either by the owner via
  // disablePaystackSubscription, OR by Paystack itself after repeated failed
  // renewal attempts. Either way, the business loses paid-tier access.
  if (event.event === "subscription.disable") {
    const data = event.data as PaystackSubscriptionEventData;
    const subscriptionCode = data.subscription_code;

    if (subscriptionCode) {
      const updated = await prisma.business.updateMany({
        where: { paystackSubscriptionCode: subscriptionCode },
        data: {
          subscriptionTier: "STARTER",
            
          paystackSubscriptionCode: null,
          paystackEmailToken: null,
        },
      });

      if (updated.count > 0) {
        console.log(
          `📉 [FreshPoint Webhook] Subscription ${subscriptionCode} disabled — business downgraded to STARTER.`,
        );
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Renewal charge failed. Paystack will retry automatically per its own
  // schedule; we just log it here. If retries are exhausted, Paystack fires
  // subscription.disable (handled above), which is what actually downgrades
  // the business — so no DB write needed on this event itself.
  if (event.event === "invoice.payment_failed") {
    const data = event.data as PaystackSubscriptionEventData;
    console.warn(
      `⚠️ [FreshPoint Webhook] Renewal payment failed for customer ${data.customer?.customer_code ?? "unknown"}.`,
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Unhandled event type — not an error, just nothing we track today.
  console.log(
    `ℹ️ [FreshPoint Webhook] Ignoring unhandled event: ${event.event}`,
  );
  return NextResponse.json({ received: true }, { status: 200 });
}
