// lib/actions/admin-vendors.ts
"use server";

import { after } from "next/server";
import { sendStoreStatusEmail } from "@/lib/store-emails";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";
import { logAdminAction } from "@/lib/actions/admin-audit";
import { z } from "zod";
import { idSchema } from "@/lib/validation";

export interface VendorDetails {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  status: string;
  isActive: boolean;
  baseDeliveryFee: number;
  deliveryFeePerKm: number;
  createdAt: Date;
  // NEW INTERFACE FIELD MAPPING
  isPayoutFrozen: boolean;
}

/**
 * Retrieves all registered businesses on the platform sorted by creation date.
 */
export async function getAllPlatformVendors(): Promise<VendorDetails[]> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    throw new Error("Unauthorized access to administrative mutations.");
  }

  return await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      status: true,
      isActive: true,
      baseDeliveryFee: true,
      deliveryFeePerKm: true,
      createdAt: true,
      // Select the new freeze column field
      isPayoutFrozen: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Force updates a business status and its active visibility state on the platform.
 */
export async function updateVendorStatusAction(
  businessId: string,
  status: "approved" | "suspended" | "pending",
  isActive: boolean,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, message: "Unauthorized access." };
  }

  const input = z
    .object({
      businessId: idSchema,
      status: z.enum(["approved", "suspended", "pending"]),
      isActive: z.boolean(),
    })
    .safeParse({ businessId, status, isActive });
  if (!input.success) {
    return { success: false, message: "Invalid vendor update request." };
  }

  try {
    const previous = await prisma.business.findUnique({
      where: { id: input.data.businessId },
      select: { status: true },
    });

    await prisma.business.update({
      where: { id: input.data.businessId },
      data: { status: input.data.status, isActive: input.data.isActive },
    });

    // Tell the owner when their store is approved or suspended (only on a real
    // change, so re-saving the same status does not send duplicates).
    if (
      previous?.status !== input.data.status &&
      (input.data.status === "approved" || input.data.status === "suspended")
    ) {
      const newStatus = input.data.status;
      after(() => sendStoreStatusEmail(input.data.businessId, newStatus));
    }

    await logAdminAction({
      action: "UPDATE_VENDOR_STATUS",
      targetType: "Vendor",
      targetId: businessId,
      metadata: { newStatus: status, isActive },
    });

    revalidatePath("/admin/businesses");
    return {
      success: true,
      message: `Vendor state successfully set to ${status}.`,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database Error";
    return {
      success: false,
      message: `Failed to override vendor parameters: ${errorMsg}`,
    };
  }
}

/**
 * NEW ACTION: Emergency lock or unlock for a store's cash withdrawals.
 * Uses simple English responses.
 */
export async function toggleVendorPayoutFreezeAction(
  businessId: string,
  freezeState: boolean,
): Promise<{ success: boolean; message: string }> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return {
      success: false,
      message: "You do not have permission to do this action.",
    };
  }

  const input = z
    .object({ businessId: idSchema, freezeState: z.boolean() })
    .safeParse({ businessId, freezeState });
  if (!input.success) {
    return { success: false, message: "Invalid payout freeze request." };
  }

  try {
    await prisma.business.update({
      where: { id: input.data.businessId },
      data: { isPayoutFrozen: input.data.freezeState },
    });

    await logAdminAction({
      action: "TOGGLE_VENDOR_PAYOUT_FROZEN",
      targetType: "Vendor",
      targetId: businessId,
      metadata: { isPayoutFrozen: freezeState },
    });

    revalidatePath("/admin/businesses");

    return {
      success: true,
      message: freezeState
        ? "Store payouts are now frozen. This business cannot take out any money."
        : "Store payouts are now unfrozen. This business can take out money normally again.",
    };
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database connection issue";
    return {
      success: false,
      message: `Could not save your lock settings: ${errorMsg}`,
    };
  }
}
