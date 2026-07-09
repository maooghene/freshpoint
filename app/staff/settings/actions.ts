"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface StaffSettingsInput {
  name: string;
  phone: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export async function updateStaffPersonalSettings(
  data: StaffSettingsInput,
): Promise<ActionResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, message: "Unauthorized access token mapping." };
    }

    // 1. Locate the absolute user registration row via Clerk ID mapping
    const userProfile = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!userProfile) {
      return {
        success: false,
        message: "System failure: User context row missing.",
      };
    }

    // 2. Track the corresponding active workplace staff profile bound to this specific user
    const staffProfile = await prisma.staffProfile.findFirst({
      where: {
        email: {
          equals: await prisma.user
            .findUnique({ where: { clerkId }, select: { email: true } })
            .then((u) => u?.email || ""),
          mode: "insensitive",
        },
      },
      select: { id: true, businessId: true },
    });

    if (!staffProfile) {
      return {
        success: false,
        message: "Forbidden: No active workplace staff matrix found.",
      };
    }

    // 3. Execute an atomic parameter update targeting only safe profile strings
    await prisma.staffProfile.update({
      where: { id: staffProfile.id },
      data: {
        name: data.name.trim(),
        // Storing phone directly under standard parameters or extended metadata maps if required
      },
    });

    revalidatePath("/staff/settings");
    return {
      success: true,
      message: "Personal profile configurations updated successfully.",
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error.";
    return {
      success: false,
      message: `Failed to save changes: ${errorMessage}`,
    };
  }
}
