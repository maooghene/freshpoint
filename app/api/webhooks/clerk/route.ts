// app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
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
 } catch (err) {
   console.error("Webhook verification failed:", err);
   return NextResponse.json(
     { error: "Invalid webhook signature" },
     { status: 400 },
   );
 }

  const { type: eventType, data } = evt;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        image: image_url ?? null,
      },
      create: {
        clerkId: id,
        email,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        image: image_url ?? null,
        role: "CUSTOMER",
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = data;
    if (id) {
      await prisma.user.deleteMany({ where: { clerkId: id } });
    }
  }

  return NextResponse.json({ received: true });
}
