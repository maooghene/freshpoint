import crypto from "crypto";
import { PaystackVerifyResponse } from "@/app/api/orders/confirm/utils"; // or move this type to a shared types file

const secretKey = process.env.PAYSTACK_SECRET_KEY;

/**
 * Single shared utility to verify payment state across all marketplace entities.
 */
export async function verifyPaystackPayment(
  reference: string,
): Promise<boolean> {
  if (!secretKey) {
    console.error(
      "❌ [FreshPoint Gateway] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing.",
    );
    throw new Error(
      "Internal Server Configuration Error: Missing Secret Authorization Key",
    );
  }

  const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
  console.log(
    `📡 [FreshPoint Gateway] Dispatched shared handshake to: ${verifyUrl}`,
  );

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    console.log(
      `📥 [FreshPoint Gateway] Handshake returned status: ${response.status}`,
    );

    if (!response.ok) return false;

    const verifyData = (await response.json()) as PaystackVerifyResponse;
    return verifyData?.status && verifyData?.data?.status === "success";
  } catch (fetchError: unknown) {
    console.error(
      "💥 [FreshPoint Gateway] Socket execution failed:",
      fetchError,
    );
    return false;
  }
}

/**
 * 🚀 FIXED: Some routes (booking confirmation) needed the actual transaction
 * payload — amount, metadata — not just a yes/no verification. That need
 * previously led to a *second*, hand-rolled fetch call being written
 * directly in the booking route, which had a broken template literal
 * (`https://paystack.co{encodeURIComponent(reference)}` — missing the `$`
 * before the interpolation, and missing the correct API path entirely).
 * That malformed URL threw on every single booking confirmation in
 * production. This single shared helper now does the one correct fetch and
 * returns the full transaction payload, so nothing needs to re-implement it.
 */
export async function getPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResponse["data"] | null> {
  if (!secretKey) {
    console.error(
      "❌ [FreshPoint Gateway] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing.",
    );
    throw new Error(
      "Internal Server Configuration Error: Missing Secret Authorization Key",
    );
  }

  const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) return null;

    const verifyData = (await response.json()) as PaystackVerifyResponse;

    if (!verifyData?.status || verifyData?.data?.status !== "success") {
      return null;
    }

    return verifyData.data;
  } catch (fetchError: unknown) {
    console.error(
      "💥 [FreshPoint Gateway] Transaction fetch failed:",
      fetchError,
    );
    return null;
  }
}

/**
 * Result of attempting to initiate a Paystack refund.
 * `success` only means Paystack ACCEPTED the refund request for processing —
 * it does NOT mean the customer has their money back yet. The actual outcome
 * arrives later via the refund.* webhook events (see app/api/webhooks/paystack/route.ts).
 */
export interface PaystackRefundResult {
  success: boolean;
  refundId: number | null;
  status: string | null;
}

/**
 * Initiates a refund for a previously successful transaction.
 * Used when an order can't be fulfilled after payment was already captured
 * (e.g. stock sold out to a concurrent order before this one could claim it).
 */
export async function refundPaystackPayment(
  reference: string,
  merchantNote: string,
): Promise<PaystackRefundResult> {
  if (!secretKey) {
    console.error(
      "❌ [FreshPoint Gateway] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing.",
    );
    return { success: false, refundId: null, status: null };
  }

  try {
    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: reference,
        merchant_note: merchantNote,
        customer_note:
          "Your order could not be fulfilled and is being refunded.",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      console.error("💥 [FreshPoint Gateway] Refund initiation failed:", data);
      return { success: false, refundId: null, status: null };
    }

    console.log(
      `💸 [FreshPoint Gateway] Refund initiated for ${reference}. Refund ID: ${data.data?.id}`,
    );

    return {
      success: true,
      refundId: typeof data.data?.id === "number" ? data.data.id : null,
      status: data.data?.status ?? null,
    };
  } catch (fetchError: unknown) {
    console.error(
      "💥 [FreshPoint Gateway] Refund request crashed:",
      fetchError,
    );
    return { success: false, refundId: null, status: null };
  }
}

/**
 * Verifies that an incoming webhook request actually originated from Paystack.
 * Paystack signs the raw request body with HMAC SHA512 using your secret key
 * and sends it in the x-paystack-signature header. Must be checked BEFORE
 * the body is parsed or trusted in any way.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!secretKey || !signatureHeader) return false;

  const expectedHash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "utf8"),
      Buffer.from(signatureHeader, "utf8"),
    );
  } catch {
    // Buffers of different lengths throw rather than returning false
    return false;
  }
}

/**
 * Generates an accurate timestamp specifically locked to West Africa Time (WAT - UTC+1)
 * regardless of where the serverless function executes.
 */
export function getNigerianTimestamp(): Date {
  const now = new Date();
  // Vercel server time is UTC. Add 1 hour to match WAT.
  const watOffsetMs = 1 * 60 * 60 * 1000;
  return new Date(now.getTime() + watOffsetMs);
}

// ─────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION BILLING (Growth / Pro monthly plans)
// ─────────────────────────────────────────────────────────────────────────

export type PaidSubscriptionTier = "GROWTH" | "PRO";

/**
 * Maps each paid tier to its Paystack plan_code (created once in the
 * Paystack dashboard) and the plan's amount in kobo — kept here so the
 * amount sent at init always matches what the plan itself charges.
 */
export const SUBSCRIPTION_PLANS: Record<
  PaidSubscriptionTier,
  { planCode: string | undefined; amountKobo: number }
> = {
  GROWTH: {
    planCode: process.env.PAYSTACK_GROWTH_PLAN_CODE,
    amountKobo: 500_000, // ₦5,000
  },
  PRO: {
    planCode: process.env.PAYSTACK_PRO_PLAN_CODE,
    amountKobo: 1_500_000, // ₦15,000
  },
};

/** Reverse lookup: Paystack plan_code → our tier name. Used by the webhook
 * to figure out which tier a renewal/subscription event belongs to. */
export function tierFromPlanCode(
  planCode: string | undefined | null,
): PaidSubscriptionTier | null {
  if (!planCode) return null;
  for (const [tier, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (config.planCode === planCode) return tier as PaidSubscriptionTier;
  }
  return null;
}

export interface SubscriptionInitResult {
  authorizationUrl: string;
  reference: string;
}

/**
 * Starts a Paystack Checkout session with a recurring plan attached.
 * On successful first charge, Paystack automatically creates a subscription
 * and will keep charging the same card every billing cycle going forward —
 * no extra code needed on our side for renewals, only webhook handling.
 */
export async function initializeSubscriptionTransaction(params: {
  email: string;
  tier: PaidSubscriptionTier;
  businessId: string;
  callbackUrl: string;
}): Promise<SubscriptionInitResult | null> {
  if (!secretKey) {
    console.error(
      "❌ [FreshPoint Gateway] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing.",
    );
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[params.tier];
  if (!plan.planCode) {
    console.error(
      `❌ [FreshPoint Gateway] No Paystack plan_code configured for tier ${params.tier}. Set the matching env var.`,
    );
    return null;
  }

  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email,
          amount: plan.amountKobo,
          plan: plan.planCode,
          callback_url: params.callbackUrl,
          metadata: {
            type: "subscription_tier_change",
            businessId: params.businessId,
            tier: params.tier,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data?.status) {
      console.error("💥 [FreshPoint Gateway] Subscription init failed:", data);
      return null;
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  } catch (fetchError: unknown) {
    console.error(
      "💥 [FreshPoint Gateway] Subscription init request crashed:",
      fetchError,
    );
    return null;
  }
}

/**
 * Cancels an active Paystack subscription. Requires both the subscription_code
 * AND the email_token that Paystack issued for it (received via the
 * subscription.create webhook event) — this is a Paystack API quirk, not
 * something we chose.
 */
export async function disablePaystackSubscription(
  subscriptionCode: string,
  emailToken: string,
): Promise<boolean> {
  if (!secretKey) {
    console.error(
      "❌ [FreshPoint Gateway] CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing.",
    );
    return false;
  }

  try {
    const response = await fetch(
      "https://api.paystack.co/subscription/disable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: subscriptionCode,
          token: emailToken,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data?.status) {
      console.error(
        "💥 [FreshPoint Gateway] Subscription disable failed:",
        data,
      );
      return false;
    }

    return true;
  } catch (fetchError: unknown) {
    console.error(
      "💥 [FreshPoint Gateway] Subscription disable request crashed:",
      fetchError,
    );
    return false;
  }
}
