"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface ActionState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    phone?: string[];
    address?: string[];
    sittingCapacity?: string[];
    categories?: string[];
    description?: string[];
    image?: string[];
  };
}

export async function updateBusinessSettings(
  businessId: string,
  slug: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        message: "Unauthorized. Please authenticate again.",
      };
    }

    const systemUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!systemUser) {
      return {
        success: false,
        message: "Account profile context not found in database.",
      };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.ownerId !== systemUser.id) {
      return {
        success: false,
        message: "Forbidden. You do not own this workspace.",
      };
    }

    const name = formData.get("name")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || null;
    const image = formData.get("image")?.toString().trim() || null;

    const sittingCapacityRaw = formData.get("sittingCapacity");
    const sittingCapacity = sittingCapacityRaw
      ? parseInt(sittingCapacityRaw.toString(), 10)
      : 1;

    const categoriesRaw = formData.get("categories")?.toString().trim();
    const categories = categoriesRaw
      ? categoriesRaw
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const errors: Record<string, string[]> = {};

    if (!name || name.length < 2) {
      errors.name = ["Business name must be at least 2 characters long."];
    }
    if (!phone || phone.length < 7) {
      errors.phone = ["Phone number must be at least 7 characters long."];
    }
    if (!address || address.length < 5) {
      errors.address = ["Address must be at least 5 characters long."];
    }
    if (isNaN(sittingCapacity) || sittingCapacity < 1) {
      errors.sittingCapacity = [
        "Sitting capacity must register at least 1 person.",
      ];
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Validation failed.", errors };
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        phone,
        address,
        sittingCapacity,
        categories,
        description,
        image,
      },
    });

    revalidatePath(`/business/${slug}`);
    revalidatePath(`/business/${slug}/settings`);

    return {
      success: true,
      message: "Vendor configurations saved successfully.",
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred.";
    return {
      success: false,
      message: `Failed to commit database update: ${errorMessage}`,
    };
  }
}
