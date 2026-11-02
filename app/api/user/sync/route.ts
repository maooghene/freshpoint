import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Synchronizes the SIGNED-IN user's profile into the database.
 *
 * Identity comes from the Clerk session, never from the request body. This
 * route used to accept a clerkId and email from the body on a public route,
 * which let anyone overwrite any user's profile.
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

    if (!clerkUser || !email) {
      return NextResponse.json(
        { error: "No email address found on this account" },
        { status: 400 },
      );
    }

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        image: clerkUser.imageUrl ?? undefined,
        // Role is deliberately never changed here, to prevent privilege injection.
      },
      create: {
        clerkId,
        email,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
        image: clerkUser.imageUrl ?? "",
        role: UserRole.CUSTOMER,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("[SYNC_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
