import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  initializeSubscriptionTransaction,
  PaidSubscriptionTier,
} from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, tier, slug } = (await req.json()) as {
      businessId: string;
      tier: PaidSubscriptionTier;
      slug: string;
    };

    if (!businessId || !tier || (tier !== "GROWTH" && tier !== "PRO")) {
      return NextResponse.json(
        { error: "Invalid subscription request" },
        { status: 400 },
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        email: true,
        owner: { select: { clerkId: true, email: true } },
      },
    });

    if (!business || business.owner.clerkId !== clerkId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const callbackUrl = `${url.origin}/business/${slug}/subscription`;
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
