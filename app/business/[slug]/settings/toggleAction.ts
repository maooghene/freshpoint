"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

export async function toggleOwnerRosterStatus(
  businessId: string,
  makeActive: boolean,
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Authentication required");

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) throw new Error("User record not found");

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, slug: true },
    });
    if (!business) throw new Error("Business not found");

    // Route through the shared helper instead of an inline ID comparison —
    // keeps this in sync with every other authorization check in the app.
    // allowStaff: false because this action is owner-only (toggling the
    // owner's own roster status shouldn't be delegable to regular staff).
    const isAuthorized = await authorizeBusinessAccess({
      businessId,
      ownerId: business.ownerId,
      systemUserId: user.id,
      allowStaff: false,
    });

    if (!isAuthorized) {
      throw new Error("Unauthorized tenant control boundary violation");
    }

    const ownerProfile = await prisma.staffProfile.findFirst({
      where: { businessId, userId: user.id },
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
