import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Syncs the signed-in Clerk user into the local User table.
 *
 * Identity comes only from the verified Clerk session. Nothing in the request
 * body is trusted, so a caller can only ever create or update their own row.
 * Role is never written on update, which prevents privilege injection.
 */
export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = clerkUser.emailAddresses
      .find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress?.toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "A verified email address is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        image: clerkUser.imageUrl ?? undefined,
      },
      create: {
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
        image: clerkUser.imageUrl ?? "",
        role: UserRole.CUSTOMER,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, role: user.role },
    });
  } catch (error: unknown) {
    console.error("[SYNC_USER_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
