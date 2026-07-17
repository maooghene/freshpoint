"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadToImageKit } from "@/lib/imagekit";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

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
    baseDeliveryFee?: string[]; // New validation track
    deliveryFeePerKm?: string[]; // New validation track
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

    // Verified via Prisma Schema: Fetch internal User cuid using unique clerkId index
    const systemUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!systemUser) {
      return {
        success: false,
        message: "Account profile context not found in database.",
      };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, image: true },
    });

    if (!business) {
      return {
        success: false,
        message: "Forbidden. You do not own this workspace.",
      };
    }

    const authorized = await authorizeBusinessAccess({
      businessId: business.id,
      ownerId: business.ownerId,
      systemUserId: systemUser.id,
      allowStaff: false, // settings are owner-only, even for real staff
    });

    if (!authorized) {
      return {
        success: false,
        message: "Forbidden. You do not own this workspace.",
      };
    }

    // Verified via Prisma Schema: ownerId references internal User.id (cuid)
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

    // New Delivery Pricing Parameters
    const baseDeliveryFeeRaw = formData.get("baseDeliveryFee");
    const baseDeliveryFee = baseDeliveryFeeRaw
      ? parseFloat(baseDeliveryFeeRaw.toString())
      : 0;

    const deliveryFeePerKmRaw = formData.get("deliveryFeePerKm");
    const deliveryFeePerKm = deliveryFeePerKmRaw
      ? parseFloat(deliveryFeePerKmRaw.toString())
      : 0;

    const file = formData.get("imageFile") as File | null;
    let savedImagePath = business.image;

    const errors: Record<string, string[]> = {};

    if (file && file.size > 0) {
      if (file.size > 4 * 1024 * 1024) {
        errors.image = [
          "File size is too massive. Maximum allowed size is 4MB.",
        ];
      }

      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.type)) {
        errors.image = [
          "Invalid format type. Only JPEG, PNG, and WebP are allowed.",
        ];
      }

      if (Object.keys(errors).length === 0) {
        try {
          savedImagePath = await uploadToImageKit(file);
        } catch (uploadError: unknown) {
          console.error("IMAGE_UPLOAD_FAILURE:", uploadError);
          return {
            success: false,
            message: "Media storage synchronization pipeline failed.",
          };
        }
      }
    }

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

    if (!name || name.length < 2)
      errors.name = ["Business name must be at least 2 characters long."];
    if (!phone || phone.length < 7)
      errors.phone = ["Phone number must be at least 7 characters long."];
    if (!address || address.length < 5)
      errors.address = ["Address must be at least 5 characters long."];
    if (isNaN(sittingCapacity) || sittingCapacity < 1)
      errors.sittingCapacity = ["Sitting capacity must be at least 1."];

    // Validate delivery fee parameters safely
    if (isNaN(baseDeliveryFee) || baseDeliveryFee < 0) {
      errors.baseDeliveryFee = [
        "Base delivery fee must be a valid number greater than or equal to 0.",
      ];
    }
    if (isNaN(deliveryFeePerKm) || deliveryFeePerKm < 0) {
      errors.deliveryFeePerKm = [
        "Delivery fee per KM must be a valid number greater than or equal to 0.",
      ];
    }
    console.log("VALIDATION_ERRORS_DEBUG:", errors);
    console.log("SUBMITTED_VALUES_DEBUG:", {
      name,
      phone,
      address,
      sittingCapacity,
      baseDeliveryFee,
      deliveryFeePerKm,
    });

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
        image: savedImagePath,
        baseDeliveryFee, // Persisting new delivery field
        deliveryFeePerKm, // Persisting new delivery field
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
