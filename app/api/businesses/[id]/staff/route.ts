import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { getStaffLimitForTier } from "@/lib/subscription-tiers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const { name, email, role, locationId } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: name and email" },
        { status: 400 },
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        slug: true,
        subscriptionTier: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Owner-only: matches original intent of this route (allowStaff: false)
    const authorized = await authorizeBusinessAccess({
      businessId: business.id,
      ownerId: business.ownerId,
      systemUserId: dbUser.id,
      allowStaff: false,
    });

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Tier-based staff account limit. Counts ALL StaffProfile rows
    // (pending + active) so a business can't dodge the cap by leaving
    // invites perpetually unaccepted.
    const staffLimit = getStaffLimitForTier(business.subscriptionTier);
    if (staffLimit !== null) {
      const currentStaffCount = await prisma.staffProfile.count({
        where: { businessId: business.id },
      });

      if (currentStaffCount >= staffLimit) {
        return NextResponse.json(
          {
            error: `Your current plan allows up to ${staffLimit} staff account${staffLimit === 1 ? "" : "s"}. Upgrade your subscription to add more.`,
            code: "STAFF_LIMIT_REACHED",
          },
          { status: 403 },
        );
      }
    }

    // locationId is trusted only after confirming it actually belongs to
    // THIS business — never take it as-is from the client. null is a valid,
    // intentional value (business-wide access), so it's only rejected when
    // a non-null id doesn't resolve to one of this business's own locations.
    let verifiedLocationId: string | null = null;
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { businessId: true },
      });
      if (!location || location.businessId !== business.id) {
        return NextResponse.json(
          { error: "Invalid location for this business" },
          { status: 400 },
        );
      }
      verifiedLocationId = locationId;
    }

    // Prevent duplicate pending/active invites for the same email at this business
    const existing = await prisma.staffProfile.findFirst({
      where: { businessId: business.id, email: cleanEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email has already been invited to this business" },
        { status: 409 },
      );
    }

    const url = new URL(req.url);
    const dynamicSignInRouteFallback = `${url.origin}/sign-in`;

    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: cleanEmail,
      redirectUrl: dynamicSignInRouteFallback,
      ignoreExisting: true,
    });

    const secureOnboardingLink = invitation.url;

    try {
      await resend.emails.send({
        from: "FreshPointTeam <onboarding@resend.dev>",
        to: cleanEmail,
        subject: `Join ${business.name} on Freshpoint!`,
        html: `
          <div style="font-family: sans-serif; max-w: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #6d28d9; margin-bottom: 4px; font-weight: 900;">Workspace Invitation</h2>
            <p style="font-size: 14px; color: #475569; margin-top: 0;">Hello ${name},</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              You have been invited to join <strong>${business.name}</strong>on FreshPoint as a <strong>${role || "Specialist"}</strong>.
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${secureOnboardingLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 12px; display: inline-block;">
                Accept Invite &amp; Complete Onboarding
              </a>
            </div>
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; border-top: 1px dashed #e2e8f0; padding-top: 12px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link: <br/>
              <span style="font-family: monospace; color: #6d28d9; word-break:break-all;">${secureOnboardingLink}</span>
            </p>
          </div>
        `,
      });
    } catch (emailError: unknown) {
      const log =
        emailError instanceof Error
          ? emailError.message
          : "Network notification exception";
      console.warn("Resend could not deliver invite email:", log);
      // Do not fail the request — the invite link still works, email is best-effort
    }

    // Pending row: userId stays null, isActive stays false, until sync-staff-roster
    // links it on real sign-in via matching email. This is what makes the
    // staff member actually reachable by authorizeBusinessAccess later.
    const newStaff = await prisma.staffProfile.create({
      data: {
        businessId: business.id,
        name: name.trim(),
        email: cleanEmail,
        role: role || "Specialist",
        isActive: false,
        locationId: verifiedLocationId,
      },
    });

    return NextResponse.json({ staff: newStaff }, { status: 201 });
  } catch (error: unknown) {
    const errTrace =
      error instanceof Error ? error.message : "Staff creation error";
    console.error("STAFF_CREATE_ERROR:", errTrace);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
