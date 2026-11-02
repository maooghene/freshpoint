import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { applySavedDowngradeSelections } from "@/lib/subscription-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.business.findMany({
    where: {
      subscriptionTier: { in: ["GROWTH", "PRO"] },
      subscriptionExpiresAt: { lte: now },
    },
    select: { id: true, name: true, subscriptionTier: true, owner: { select: { email: true } } },
    take: 100,
  });

  let downgraded = 0;
  let emailsSent = 0;
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  for (const business of expired) {
    const claimed = await prisma.business.updateMany({
      where: { id: business.id, subscriptionExpiresAt: { lte: now }, subscriptionTier: business.subscriptionTier },
      data: { subscriptionExpiresAt: null },
    });
    if (claimed.count !== 1) continue;

    await applySavedDowngradeSelections(business.id);
    await prisma.business.update({
      where: { id: business.id },
      data: { paystackSubscriptionCode: null, paystackEmailToken: null },
    });
    downgraded++;

    if (resend && business.owner.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "FreshPoint <notifications@freshpoint.com>",
        to: business.owner.email,
        subject: "Your FreshPoint paid plan has expired",
        html: `<p>Your ${business.subscriptionTier} plan for <strong>${business.name}</strong> has ended. The business is now on Starter. You can choose a paid plan again from the subscription page.</p>`,
      }).catch((error) => console.error("SUBSCRIPTION_EXPIRY_EMAIL_ERROR", error));
      emailsSent++;
    }
  }

  return NextResponse.json({ downgraded, emailsSent });
}
