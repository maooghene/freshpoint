import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

interface PaystackRefundEventData {
  id: number;
  status: string;
}

interface PaystackWebhookEvent {
  event: string;
  data: PaystackRefundEventData;
}

const REFUND_STATUS_BY_EVENT: Record<string, string> = {
  "refund.pending": "pending",
  "refund.processing": "processing",
  "refund.processed": "processed",
  "refund.failed": "failed",
};

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

  const mappedStatus = REFUND_STATUS_BY_EVENT[event.event];

  if (mappedStatus) {
    const refundId = event.data?.id;

    if (typeof refundId === "number") {
      try {
        const updated = await prisma.order.updateMany({
          where: { paystackRefundId: refundId },
          data: { refundStatus: mappedStatus },
        });

        if (updated.count === 0) {
          console.warn(
            `⚠️ [FreshPoint Webhook] No order matched Paystack refund ID ${refundId} for event "${event.event}"`,
          );
        } else {
          console.log(
            `📦 [FreshPoint Webhook] Refund ${refundId} → "${mappedStatus}" (${updated.count} order updated)`,
          );
        }
      } catch (err) {
        console.error(
          "🚨 [FreshPoint Webhook] Failed to persist refund status update:",
          err,
        );
        // Still return 200 below — Paystack will retry on non-200, and a
        // DB hiccup here shouldn't cause unbounded webhook retries.
      }
    }
  } else {
    // Unhandled event type — not an error, just nothing we track today.
    console.log(
      `ℹ️ [FreshPoint Webhook] Ignoring unhandled event: ${event.event}`,
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
