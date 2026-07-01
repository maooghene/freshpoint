// app/api/businesses/[id]/staff/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend"; // 🔑 Import the free email delivery package

// Initialize Resend using your secure environment token
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: pathIdentifier } = await params;
    const { email, name, role } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required invitation properties" },
        { status: 400 },
      );
    }

    // Resolve the business profile workspace
    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: pathIdentifier }, { slug: pathIdentifier }],
        owner: { clerkId: userId },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Workspace profile space not found or unauthorized" },
        { status: 404 },
      );
    }

    // Dynamically resolve the absolute domain origin matching the request context
    const url = new URL(req.url);
    const dynamicRedirectUrl = `${url.origin}/sign-in`;

    // 1️⃣ Clerk v5+ Invitation token generation pipeline
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email.toLowerCase(),
      redirectUrl: dynamicRedirectUrl,
      ignoreExisting: true,
    });

    // 2️⃣ RESEND FREE EMAIL BLOCK: Fires a real notification directly to the invited professional
    try {
      await resend.emails.send({
        from: "Freshpoint Team <onboarding@resend.dev>", // Resend provides this domain for free testing!
        to: email.toLowerCase(),
        subject: `Join ${business.name} on Freshpoint!`,
        html: `
          <div style="font-family: sans-serif; max-w: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #6d28d9; margin-bottom: 4px;">Workspace Invitation</h2>
            <p style="font-size: 14px; color: #475569; margin-top: 0;">Hello ${name},</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              You have been invited by the manager of <strong>${business.name}</strong> to join their digital roster space on Freshpoint as a <strong>${role || "Specialist"}</strong>.
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${dynamicRedirectUrl}" style="background-color: #6d28d9; color: white; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 12px; display: inline-block; shadow: 0 4px 6px rgba(0,0,0,0.05);">
                Accept Invite & Complete Onboarding
              </a>
            </div>
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; border-t: 1px dashed #e2e8f0; pt: 12px;">
              If the link button above doesn't work, copy and paste this link URL directly into your internet browser search bar: <br/>
              <span style="font-family: monospace; color: #6d28d9;">${dynamicRedirectUrl}</span>
            </p>
          </div>
        `,
      });
      console.log(
        `✉️ EMAIL DISPATCHED: Onboarding packet delivered successfully to ${email}.`,
      );
    } catch (emailError) {
      // Log the warning but don't crash the database save operation if the email fails during dev testing
      console.warn(
        "⚠️ Resend could not deliver message body envelope:",
        emailError,
      );
    }

    // 3️⃣ Provision a pending roster row under this verified tenant store identifier
    const newStaff = await prisma.staffProfile.create({
      data: {
        businessId: business.id,
        name: name,
        role: role || "Specialist",
        email: email.toLowerCase(),
        isActive: false,
      },
    });

    return NextResponse.json(
      { success: true, staff: newStaff },
      { status: 201 },
    );
  } catch (error) {
    console.error("Staff addition pipeline error:", error);
    return NextResponse.json(
      { error: "Internal server processing failure" },
      { status: 500 },
    );
  }
}
