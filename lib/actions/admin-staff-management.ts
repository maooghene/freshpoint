// lib/actions/admin-staff-management.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";
import { PlatformAdminRole, UserRole } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { idSchema, emailSchema } from "@/lib/validation";

export interface PlatformStaffData {
  id: string;
  adminRole: PlatformAdminRole;
  isActive: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };
}

/**
 * Provisions a user account with granular platform-level administration privileges.
 */
export async function provisionPlatformAdminAction(
  email: string,
  targetRole: PlatformAdminRole,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return {
      success: false,
      message:
        "Critical Security Error: Absolute Master Admin privileges required.",
    };
  }

  const input = z
    .object({ email: emailSchema, targetRole: z.nativeEnum(PlatformAdminRole) })
    .safeParse({ email, targetRole });
  if (!input.success) {
    return { success: false, message: "Enter a valid email and platform role." };
  }

  try {
    const lowerEmail = input.data.email;
    const userRecord = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!userRecord) {
      return {
        success: false,
        message:
          "No registered user account found matching that email address.",
      };
    }

    // Never turn the master admin into platform staff: that would silently
    // strip their ADMIN role.
    if (userRecord.role === UserRole.ADMIN) {
      return {
        success: false,
        message: "This account is a master admin and cannot be reassigned.",
      };
    }

    // Atomic Update Transaction: Changes their base user role and builds their admin configurations
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userRecord.id },
        data: { role: UserRole.STAFF },
      }),
      prisma.platformAdminProfile.upsert({
        where: { userId: userRecord.id },
        update: { adminRole: input.data.targetRole, isActive: true },
        create: {
          userId: userRecord.id,
          adminRole: input.data.targetRole,
          isActive: true,
        },
      }),
    ]);

    // Push the updated role profile metadata down to Clerk to synchronize their session token
    const client = await clerkClient();
    await client.users.updateUserMetadata(userRecord.clerkId, {
      publicMetadata: { role: UserRole.STAFF },
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      message: `Successfully provisioned ${lowerEmail} as a platform ${targetRole}.`,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database Error";
    return {
      success: false,
      message: `Failed to provision platform role permissions: ${errorMsg}`,
    };
  }
}

/**
 * Suspends or activates a staff member's administrative system access.
 */
export async function togglePlatformStaffStatusAction(
  profileId: string,
  isActive: boolean,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, message: "Unauthorized adjustment block." };
  }

  const input = z
    .object({ profileId: idSchema, isActive: z.boolean() })
    .safeParse({ profileId, isActive });
  if (!input.success) {
    return { success: false, message: "Invalid staff update request." };
  }

  try {
    await prisma.platformAdminProfile.update({
      where: { id: input.data.profileId },
      data: { isActive: input.data.isActive },
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      message: "Platform operator permissions updated successfully.",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database Error";
    return {
      success: false,
      message: `Failed to adjust permissions state: ${errorMsg}`,
    };
  }
}

/**
 * Retrieves a list of all active and suspended platform management records.
 */
export async function getPlatformAdminCrewList(): Promise<PlatformStaffData[]> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    throw new Error(
      "Unauthorized access to platform administration list data.",
    );
  }

  return await prisma.platformAdminProfile.findMany({
    select: {
      id: true,
      adminRole: true,
      isActive: true,
      user: {
        select: { firstName: true, lastName: true, email: true, image: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
