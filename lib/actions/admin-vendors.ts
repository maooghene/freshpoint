// lib/actions/admin-vendors.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";

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

  try {
    await prisma.business.update({
      where: { id: businessId },
      data: { status, isActive },
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
