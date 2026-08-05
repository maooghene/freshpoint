"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleOwnerRosterStatus(
  businessId: string,
  makeActive: boolean,
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Authentication required");

    // Retrieve system user matching Clerk identity sequence
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) throw new Error("User record not found");

    // Verify ownership bound to businessId parameter limits
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, slug: true },
    });

    if (!business || business.ownerId !== clerkId) {
      throw new Error("Unauthorized tenant control boundary violation");
    }

    // Locate owner's corresponding row inside StaffProfile table map
    const ownerProfile = await prisma.staffProfile.findFirst({
      where: {
        businessId: businessId,
        userId: user.id,
      },
    });

    if (!ownerProfile) {
      throw new Error("Owner staff profile tracking record missing");
    }

    await prisma.staffProfile.update({
      where: { id: ownerProfile.id },
      data: { isActive: makeActive },
    });

    revalidatePath(`/business/${business.slug}/settings`);
    return { success: true, isActive: makeActive };
  } catch (error) {
    console.error("Roster toggle failure node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal system crash",
    };
  }
}
