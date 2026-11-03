"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseValue, text, phoneSchema } from "@/lib/validation";

export interface StaffSettingsInput {
  name: string;
  phone: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

const staffSettingsSchema = z.object({
  name: text(120, 2),
  phone: phoneSchema.optional(),
});

export async function updateStaffPersonalSettings(
  data: StaffSettingsInput,
): Promise<ActionResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, message: "Unauthorized access token mapping." };
    }

    // Server actions are public endpoints: never trust the argument's shape.
    const parsed = parseValue(data, staffSettingsSchema);
    if (!parsed.ok) {
      return {
        success: false,
        message: "Please enter a name between 2 and 120 characters.",
      };
    }

    const userProfile = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });

    if (!userProfile) {
      return {
        success: false,
        message: "System failure: User context row missing.",
      };
    }

    // A person can be rostered at several businesses, so update every
    // staff profile that belongs to this user (linked by account or email).
    const result = await prisma.staffProfile.updateMany({
      where: {
        OR: [
          { userId: userProfile.id },
          ...(userProfile.email
            ? [{ email: { equals: userProfile.email, mode: "insensitive" as const } }]
            : []),
        ],
      },
      data: { name: parsed.data.name },
    });

    if (result.count === 0) {
      return {
        success: false,
        message: "Forbidden: No active workplace staff matrix found.",
      };
    }

    revalidatePath("/staff/settings");
    return {
      success: true,
      message: "Personal profile configurations updated successfully.",
    };
  } catch (error: unknown) {
    console.error("UPDATE_STAFF_SETTINGS_ERROR:", error);
    return {
      success: false,
      message: "Could not save your changes. Please try again.",
    };
  }
}
