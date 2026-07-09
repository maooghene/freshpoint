import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "No webhook secret configured" },
      { status: 500 },
    );
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing required svix security headers" },
      { status: 400 },
    );
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Signature Error";
    console.error("Webhook verification failed:", errorMsg);
    return NextResponse.json(
      { error: "Invalid cryptographic webhook signature match" },
      { status: 400 },
    );
  }

  const { type: eventType, data } = evt;

  // 1. Sync User Registration & Core Modifications Data Upstream
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "No email address found in profile telemetry" },
        { status: 400 },
      );
    }

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email: email.toLowerCase().trim(),
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        image: image_url ?? null,
      },
      create: {
        clerkId: id,
        email: email.toLowerCase().trim(),
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        image: image_url ?? null,
        role: "CUSTOMER", // Maintain your standard default application fallback enum roles
      },
    });
  }

  // 2. Cascade Purge Orphaned Business Records Securely
  if (eventType === "user.deleted") {
    const { id: clerkId } = data;

    if (clerkId) {
      // Find the local user first to extract the primary relational system ID
      const internalUser = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (internalUser) {
        /*
          🔥 PERMANENT MULTI-TENANT CLEANUP:
          Manually delete all businesses owned by this internal user record
          before purging the user to prevent orphaned data strings in Postgres.
        */
        await prisma.business.deleteMany({
          where: { ownerId: internalUser.id },
        });

        // Delete the user record now that dependencies are clear
        await prisma.user.delete({
          where: { id: internalUser.id },
        });
      } else {
        // Fallback catch-all in case the internal mapping context is already partially purged
        await prisma.user.deleteMany({
          where: { clerkId },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
