"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadToImageKit } from "@/lib/imagekit";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { validateImageFile } from "@/lib/validation";

const MAX_DELIVERY_FEE = 1_000_000;
const MAX_DELIVERY_RADIUS_KM = 200;

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
    deliveryRadiusKm?: string[];
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
      select: { id: true, ownerId: true, image: true, subscriptionTier: true },
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

    // Delivery radius is optional for every plan. Blank = no custom limit.
    const deliveryRadiusKmRaw = formData.get("deliveryRadiusKm");
    let deliveryRadiusKm: number | null = null;
    if (deliveryRadiusKmRaw && deliveryRadiusKmRaw.toString().trim() !== "") {
      deliveryRadiusKm = parseFloat(deliveryRadiusKmRaw.toString());
    }

    const file = formData.get("imageFile") as File | null;
    let savedImagePath = business.image;

    const errors: Record<string, string[]> = {};

    const hasNewImage = file instanceof File && file.size > 0;
    if (hasNewImage) {
      const imageError = validateImageFile(file);
      if (imageError) errors.image = [imageError];
    }

    const sittingCapacityRaw = formData.get("sittingCapacity");
    const sittingCapacity = sittingCapacityRaw
      ? parseInt(sittingCapacityRaw.toString(), 10)
      : 1;

    const categoriesRaw = formData.get("categories")?.toString().trim();
    const categories = categoriesRaw
      ? [
          ...new Set(
            categoriesRaw
              .split(",")
              .map((c) => c.trim().toUpperCase())
              .filter(Boolean),
          ),
        ]
      : [];

    if (categories.length > 3) {
      errors.categories = ["You can select a maximum of 3 categories."];
    } else if (categories.length > 0) {
      const matched = await prisma.businessCategory.findMany({
        where: { value: { in: categories }, isActive: true },
        select: { value: true },
      });
      const valid = new Set(matched.map((c) => c.value));
      if (!categories.every((c) => valid.has(c))) {
        errors.categories = ["One or more selected categories are invalid."];
      }
    }

    if (!name || name.length < 2 || name.length > 120)
      errors.name = ["Business name must be between 2 and 120 characters."];
    if (
      !phone ||
      phone.length < 7 ||
      phone.length > 30 ||
      !/^[+()\-\s\d]+$/.test(phone)
    )
      errors.phone = ["Phone number must be 7-30 digits (spaces, + and - allowed)."];
    if (!address || address.length < 5 || address.length > 300)
      errors.address = ["Address must be between 5 and 300 characters."];
    if (description && description.length > 2000)
      errors.description = ["Description must be 2000 characters or fewer."];
    if (isNaN(sittingCapacity) || sittingCapacity < 1 || sittingCapacity > 100000)
      errors.sittingCapacity = ["Sitting capacity must be between 1 and 100,000."];

    // Validate delivery fee parameters safely
    if (
      !Number.isFinite(baseDeliveryFee) ||
      baseDeliveryFee < 0 ||
      baseDeliveryFee > MAX_DELIVERY_FEE
    ) {
      errors.baseDeliveryFee = [
        "Base delivery fee must be a number between 0 and 1,000,000.",
      ];
    }
    if (
      !Number.isFinite(deliveryFeePerKm) ||
      deliveryFeePerKm < 0 ||
      deliveryFeePerKm > MAX_DELIVERY_FEE
    ) {
      errors.deliveryFeePerKm = [
        "Delivery fee per KM must be a number between 0 and 1,000,000.",
      ];
    }

    // Only validate the radius value itself when this tier is even allowed
    // to set one — a Starter/Growth submission was already forced to null
    // above, so there's nothing here to validate for them.
    if (deliveryRadiusKm !== null) {
      if (
        !Number.isFinite(deliveryRadiusKm) ||
        deliveryRadiusKm <= 0 ||
        deliveryRadiusKm > MAX_DELIVERY_RADIUS_KM
      ) {
        errors.deliveryRadiusKm = [
          "Delivery radius must be a number between 0 and 200 km.",
        ];
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Validation failed.", errors };
    }

    if (hasNewImage) {
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
        deliveryRadiusKm, // null = use tier default; only ever non-null for Pro
      },
    });

    revalidatePath(`/business/${slug}`);
    revalidatePath(`/business/${slug}/settings`);

    return {
      success: true,
      message: "Vendor configurations saved successfully.",
    };
  } catch (error: unknown) {
    console.error("UPDATE_BUSINESS_SETTINGS_ERROR:", error);
    return {
      success: false,
      message: "Could not save your settings. Please try again.",
    };
  }
}
