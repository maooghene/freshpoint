import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { hasPromotionalBroadcasts } from "@/lib/subscription-tiers";
import { parseJsonBody, text, optionalText } from "@/lib/validation";
import { auditImpersonatedAction } from "@/lib/impersonation-audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MIN_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Shared checks: signed in, owns (or impersonates) the business. */
async function authorize(context: RouteContext) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { id: businessId } = await context.params;
  const systemUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, subscriptionTier: true },
  });
  if (!systemUser || !business) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  const authorized = await authorizeBusinessAccess({
    businessId,
    ownerId: business.ownerId,
    systemUserId: systemUser.id,
    allowStaff: false,
  });
  if (!authorized) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { systemUser, business };
}

/** Start a promotion. Only one can be active at a time. */
export async function POST(request: NextRequest, context: RouteContext) {
  const result = await authorize(context);
  if ("error" in result) return result.error;
  const { systemUser, business } = result;

  if (!hasPromotionalBroadcasts(business.subscriptionTier)) {
    return NextResponse.json(
      { error: "Promotions require Pro", code: "PROMO_TIER_REQUIRED" },
      { status: 403 },
    );
  }

  const parsed = await parseJsonBody(
    request,
    z.object({
      title: text(80, 3),
      details: optionalText(300),
      endsAt: z.coerce.date({ message: "Enter a valid end date and time." }),
    }),
  );
  if (!parsed.ok) return parsed.response;
  const { title, details, endsAt } = parsed.data;

  const now = Date.now();
  const duration = endsAt.getTime() - now;
  if (duration < MIN_DURATION_MS) {
    return NextResponse.json(
      { error: "The offer must run for at least 10 minutes." },
      { status: 400 },
    );
  }
  if (duration > MAX_DURATION_MS) {
    return NextResponse.json(
      { error: "An offer can run for at most 30 days." },
      { status: 400 },
    );
  }

  const active = await prisma.promotion.findFirst({
    where: { businessId: business.id, isActive: true, endsAt: { gt: new Date(now) } },
    select: { id: true },
  });
  if (active) {
    return NextResponse.json(
      {
        error: "You already have a running promotion. End it before starting a new one.",
        code: "PROMO_ALREADY_ACTIVE",
      },
      { status: 409 },
    );
  }

  const promotion = await prisma.promotion.create({
    data: {
      businessId: business.id,
      title,
      details: details ?? null,
      startsAt: new Date(now),
      endsAt,
      createdById: systemUser.id,
    },
  });

  await auditImpersonatedAction({
    businessId: business.id,
    ownerId: business.ownerId,
    actorUserId: systemUser.id,
    action: "IMPERSONATED_PROMOTION_STARTED",
    metadata: { promotionId: promotion.id, title, endsAt: endsAt.toISOString() },
  });

  return NextResponse.json({ promotion }, { status: 201 });
}

/** End the running promotion early. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const result = await authorize(context);
  if ("error" in result) return result.error;
  const { systemUser, business } = result;

  const ended = await prisma.promotion.updateMany({
    where: { businessId: business.id, isActive: true },
    data: { isActive: false },
  });

  if (ended.count > 0) {
    await auditImpersonatedAction({
      businessId: business.id,
      ownerId: business.ownerId,
      actorUserId: systemUser.id,
      action: "IMPERSONATED_PROMOTION_ENDED",
    });
  }

  return NextResponse.json({ ended: ended.count });
}
