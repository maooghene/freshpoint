// app/api/auth/sync-staff-roster/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Fetch live authenticated profile email identifiers from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Authentication credentials required" },
        { status: 401 },
      );
    }

    const emailAddressString =
      clerkUser.emailAddresses[0]?.emailAddress.toLowerCase();
    if (!emailAddressString) {
      return NextResponse.json(
        { error: "Valid account email required" },
        { status: 400 },
      );
    }

    // 2. Locate or resolve the base user profile row mapping constants
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      // Re-provision baseline context maps if they haven't passed standard webhooks yet
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          firstName: clerkUser.firstName || "Teammate",
          lastName: clerkUser.lastName || "Profile",
          email: emailAddressString,
          image: clerkUser.imageUrl || null,
        },
      });
    }

    // 3. Find the pending invitation that matches this email address
    const pendingInvitation = await prisma.staffProfile.findFirst({
      where: {
        email: emailAddressString,
        userId: null, // Only claim invitations that haven't been claimed yet
      },
      include: { business: true }, // Pull the business details to get its URL slug
    });

    if (!pendingInvitation) {
      return NextResponse.json(
        {
          error:
            "No matching pending invitation found. Please ask your shop manager to resend your invite.",
        },
        { status: 404 },
      );
    }

    // 4. ATOMIC ROSTER ACTIVATION: Link their profile and set them to active!
    await prisma.staffProfile.update({
      where: { id: pendingInvitation.id },
      data: {
        userId: dbUser.id, // Connects the Prisma user profile
        isActive: true, // Sets them to Active / Linked
        name: `${dbUser.firstName} ${dbUser.lastName || ""}`.trim(), // Sync name with real registration credentials
      },
    });

    return NextResponse.json(
      {
        success: true,
        businessSlug: pendingInvitation.business.slug,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("STAFF_ROSTER_SYNC_ERROR:", error);
    return NextResponse.json(
      { error: "Internal service connection error" },
      { status: 500 },
    );
  }
}
