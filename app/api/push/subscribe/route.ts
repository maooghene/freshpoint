import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId, subscription } = await req.json();
  if (!businessId || !subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

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
  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}
