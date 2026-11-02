import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { hasPromotionalBroadcasts } from "@/lib/subscription-tiers";

const MAX_BROADCASTS_PER_DAY = 5;

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: businessId } = await context.params;
  const systemUser = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true, ownerId: true, subscriptionTier: true } });
  if (!systemUser || !business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const authorized = await authorizeBusinessAccess({ businessId, ownerId: business.ownerId, systemUserId: systemUser.id, allowStaff: false });
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!hasPromotionalBroadcasts(business.subscriptionTier)) {
    return NextResponse.json({ error: "Promotional broadcasts require Pro", code: "BROADCAST_TIER_REQUIRED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (title.length < 3 || message.length < 5) {
    return NextResponse.json({ error: "Title and message must be at least 3 and 5 characters" }, { status: 400 });
  }
  if (title.length > 100 || message.length > 1000) {
    return NextResponse.json({ error: "Title must be at most 100 characters and message at most 1000" }, { status: 400 });
  }

  // Broadcasts are shown to every visitor of the business, so cap how many a
  // single business can publish per day to prevent spam.
  const recentCount = await prisma.announcement.count({
    where: {
      targetType: "BUSINESS",
      targetBusinessId: businessId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recentCount >= MAX_BROADCASTS_PER_DAY) {
    return NextResponse.json(
      { error: `You can publish at most ${MAX_BROADCASTS_PER_DAY} broadcasts per day`, code: "BROADCAST_RATE_LIMITED" },
      { status: 429 },
    );
  }

  const announcement = await prisma.announcement.create({
    data: { title, message, severity: "INFO", targetType: "BUSINESS", targetBusinessId: businessId, createdById: systemUser.id },
  });
  return NextResponse.json({ announcement }, { status: 201 });
}
