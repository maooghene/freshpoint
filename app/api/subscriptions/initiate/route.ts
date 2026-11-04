import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditImpersonatedAction } from "@/lib/impersonation-audit";
import { z } from "zod";
import { parseJsonBody, idSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { initializeSubscriptionTransaction } from "@/lib/paystack";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { compareTierRank } from "@/lib/subscription-tiers";

export async function POST(req: NextRequest) {
  {
    const limited = await rateLimit(req, RATE_LIMITS.payment);
    if (limited) return limited;
  }
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseJsonBody(
      req,
      z.object({
        businessId: idSchema,
        tier: z.enum(["GROWTH", "PRO"]),
      }),
    );
    if (!parsed.ok) return parsed.response;
    const { businessId, tier } = parsed.data;

    const systemUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });

    if (!systemUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        ownerId: true,
        email: true,
        slug: true,
        subscriptionTier: true,
        owner: { select: { email: true } },
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

    if (business.subscriptionTier === tier) {
      return NextResponse.json(
        { error: "This business is already on that plan." },
        { status: 400 },
      );
    }

    // Moving from a paid plan to a lower paid plan would need a staff and
    // location selection and would create a second subscription. Route it
    // through the Starter downgrade flow instead.
    if (
      business.subscriptionTier !== "STARTER" &&
      compareTierRank(tier, business.subscriptionTier) > 0
    ) {
      return NextResponse.json(
        {
          error:
            "To move to a lower plan, downgrade to Starter first, then choose your new plan.",
        },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    // Use the stored slug, not the client-supplied one.
    const callbackUrl = `${url.origin}/business/${business.slug}/subscription`;
    // Bill the business owner, never the signed-in user: under admin
    // impersonation the signed-in user is the admin.
    const billingEmail = business.owner.email || business.email;

    const result = await initializeSubscriptionTransaction({
      email: billingEmail,
      tier,
      businessId,
      callbackUrl,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Could not start subscription checkout" },
        { status: 500 },
      );
    }

    await auditImpersonatedAction({
      businessId,
      ownerId: business.ownerId,
      actorUserId: systemUser.id,
      action: "IMPERSONATED_CHECKOUT_STARTED",
      metadata: { fromTier: business.subscriptionTier, toTier: tier },
    });

    return NextResponse.json({ authorizationUrl: result.authorizationUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("SUBSCRIPTION_INITIATE_ERROR:", msg);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
