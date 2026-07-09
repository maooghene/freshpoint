import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Standardized Pluralized Named Instance Wrapper Export
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESRESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized profile context" },
        { status: 401 },
      );
    }

    const { id: pathIdentifier } = await params;
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request context payload body" },
        { status: 400 },
      );
    }

    const { email, name, role } = body as {
      email?: string;
      name?: string;
      role?: string;
    };

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required invitation properties parameter keys" },
        { status: 400 },
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Resolve the business profile workspace securely
    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: pathIdentifier }, { slug: pathIdentifier }],
        owner: { clerkId: userId },
      },
    });

    if (!business) {
      return NextResponse.json(
        {
          error:
            "Workspace profile space not found or unauthorized resource matching",
        },
        { status: 404 },
      );
    }

    const url = new URL(req.url);
    const dynamicSignInRouteFallback = `${url.origin}/sign-in`;

    // 1️⃣ Clerk v5+ Explicit Invitation token generation pipeline
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: cleanEmail,
      redirectUrl: dynamicSignInRouteFallback,
      ignoreExisting: true,
    });

    /* 
      🎯 THE ABSOLUTE LINK FIX: 
      Instead of routing employees to a plain /sign-in route string block, 
      we pass the unique, secure registration URL context ('invitation.url') 
      generated dynamically by Clerk's security ecosystem.
    */
    const secureOnboardingLink = invitation.url;

    // 🚀 CHOSEN LOG LOCATION FOR LOCAL TESTING:
    console.log("====================================================");
    console.log("⚠️ SECURE INVITATION LINK GENERATED FOR TEST USER:");
    console.log(`📧 Email: ${cleanEmail}`);
    console.log(`🔗 Link:  ${secureOnboardingLink}`);
    console.log("====================================================");

    // 2️⃣ RESEND EMAIL BLOCK: Fires a notification packet directly to the invited professional
    try {
      await resend.emails.send({
        from: "Freshpoint Team <onboarding@resend.dev>",
        to: cleanEmail,
        subject: `Join ${business.name} on Freshpoint!`,
        html: `
          <div style="font-family: sans-serif; max-w: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #6d28d9; margin-bottom: 4px; font-weight: 900; tracking: -0.05em;">Workspace Invitation</h2>
            <p style="font-size: 14px; color: #475569; margin-top: 0;">Hello ${name},</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              You have been invited by the manager of <strong>${business.name}</strong> to join their digital roster space on Freshpoint as a <strong>${role || "Specialist"}</strong>.
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${secureOnboardingLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 12px; display: inline-block;">
                Accept Invite &amp; Complete Onboarding
              </a>
            </div>
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; border-top: 1px dashed #e2e8f0; padding-top: 12px; margin-top: 20px;">
              If the link button above doesn&apos;t work, copy and paste this secure URL directly into your browser address bar: <br/>
              <span style="font-family: monospace; color: #6d28d9; word-break: break-all;">${secureOnboardingLink}</span>
            </p>
          </div>
        `,
      });
    } catch (emailError: unknown) {
      const log =
        emailError instanceof Error
          ? emailError.message
          : "Network notification exception";
      console.warn(
        "⚠️ Resend could not deliver message body envelope safely:",
        log,
      );
    }

    // 3️⃣ Provision a pending roster row under this verified tenant store identifier
    const newStaff = await prisma.staffProfile.create({
      data: {
        businessId: business.id,
        name: name,
        role: role || "Specialist",
        email: cleanEmail,
        isActive: false,
      },
    });

    return NextResponse.json(
      { success: true, staff: newStaff },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errTrace =
      error instanceof Error
        ? error.message
        : "Fatal staff processing thread error";
    console.error("Staff addition pipeline error:", errTrace);
    return NextResponse.json(
      { error: "Internal server processing failure" },
      { status: 500 },
    );
  }
}
