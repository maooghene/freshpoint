import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { hasPromotionalBroadcasts } from "@/lib/subscription-tiers";
import { parseJsonBody, text } from "@/lib/validation";
import { auditImpersonatedAction } from "@/lib/impersonation-audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const BROADCAST_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const BROADCAST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest, context: RouteContext) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authorized = await authorizeBusinessAccess({
    businessId,
    ownerId: business.ownerId,
    systemUserId: systemUser.id,
    allowStaff: false,
  });
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!hasPromotionalBroadcasts(business.subscriptionTier)) {
    return NextResponse.json(
      {
        error: "Promotional broadcasts require Pro",
        code: "BROADCAST_TIER_REQUIRED",
      },
      { status: 403 },
    );
  }

  const parsed = await parseJsonBody(
    request,
    z.object({ title: text(100, 3), message: text(1000, 5) }),
  );
  if (!parsed.ok) return parsed.response;
  const { title, message } = parsed.data;

  // One public broadcast per 24 hours keeps the storefront from being spammed.
  const now = Date.now();
  const recent = await prisma.announcement.findFirst({
    where: {
      targetType: "BUSINESS",
      targetBusinessId: businessId,
      isPublic: true,
      createdAt: { gt: new Date(now - BROADCAST_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent) {
    const retryAt = new Date(recent.createdAt.getTime() + BROADCAST_COOLDOWN_MS);
    return NextResponse.json(
      {
        error: "You can send one broadcast every 24 hours.",
        code: "BROADCAST_RATE_LIMITED",
        retryAt: retryAt.toISOString(),
      },
      { status: 429 },
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      message,
      severity: "INFO",
      targetType: "BUSINESS",
      targetBusinessId: businessId,
      isPublic: true,
      startsAt: new Date(now),
      endsAt: new Date(now + BROADCAST_LIFETIME_MS),
      createdById: systemUser.id,
    },
  });

  await auditImpersonatedAction({
    businessId,
    ownerId: business.ownerId,
    actorUserId: systemUser.id,
    action: "IMPERSONATED_BROADCAST_SENT",
    metadata: { announcementId: announcement.id, title },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
