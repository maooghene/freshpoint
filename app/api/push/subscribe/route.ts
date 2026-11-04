import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { parseJsonBody, idSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

export async function POST(req: NextRequest) {
  {
    const limited = await rateLimit(req, RATE_LIMITS.mutation);
    if (limited) return limited;
  }
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(
    req,
    z.object({
      businessId: idSchema,
      subscription: z.object({
        endpoint: z.string().trim().max(2048).startsWith("https://"),
        keys: z.object({
          p256dh: z.string().trim().min(1).max(256),
          auth: z.string().trim().min(1).max(128),
        }),
      }),
    }),
  );
  if (!parsed.ok) return parsed.response;
  const { businessId, subscription } = parsed.data;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const authorized = await authorizeBusinessAccess({
    businessId: business.id,
    ownerId: business.ownerId,
    systemUserId: dbUser.id,
    allowStaff: true,
  });
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      businessId: business.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      businessId: business.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  {
    const limited = await rateLimit(req, RATE_LIMITS.mutation);
    if (limited) return limited;
  }
  const parsedDelete = await parseJsonBody(
    req,
    z.object({ endpoint: z.string().trim().min(1).max(2048) }),
  );
  if (!parsedDelete.ok) return parsedDelete.response;
  const { endpoint } = parsedDelete.data;

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}
