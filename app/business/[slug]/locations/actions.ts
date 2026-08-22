"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { canAddLocation } from "@/lib/subscription-tiers";

export interface LocationActionState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    address?: string[];
    latitude?: string[];
    longitude?: string[];
    deliveryRadiusKm?: string[];
  };
}

export async function createLocation(
  businessId: string,
  slug: string,
  prevState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
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
      select: { id: true, ownerId: true, subscriptionTier: true },
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
      allowStaff: false, // location management is owner-only, same as settings
    });

    if (!authorized) {
      return {
        success: false,
        message: "Forbidden. You do not own this workspace.",
      };
    }

    // Tier gate: the real security boundary. Looked up from the business's
    // own subscriptionTier (never trusted from the form) and the business's
    // actual current location count (never trusted from the client either).
    // A Starter/Growth owner hitting this action directly — e.g. via
    // devtools, bypassing a disabled "Add Location" button — gets rejected
    // here, not just blocked by UI. Same pattern as canCustomizeDeliveryRadius
    // in settings/actions.ts.
    const currentLocationCount = await prisma.location.count({
      where: { businessId: business.id },
    });

    if (!canAddLocation(business.subscriptionTier, currentLocationCount)) {
      return {
        success: false,
        message:
          "Adding another location requires the Pro plan. Upgrade to add multiple locations.",
      };
    }

    const name = formData.get("name")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || "";

    const latitudeRaw = formData.get("latitude");
    const longitudeRaw = formData.get("longitude");
    const latitude = latitudeRaw ? parseFloat(latitudeRaw.toString()) : NaN;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw.toString()) : NaN;

    // Optional: blank = fall back to tier default at read-time, same as
    // deliveryRadiusKm does on Business today.
    const deliveryRadiusKmRaw = formData.get("deliveryRadiusKm");
    const deliveryRadiusKm =
      deliveryRadiusKmRaw && deliveryRadiusKmRaw.toString().trim() !== ""
        ? parseFloat(deliveryRadiusKmRaw.toString())
        : null;

    const errors: Record<string, string[]> = {};

    if (!name || name.length < 2) {
      errors.name = ["Location name must be at least 2 characters long."];
    }
    if (!address || address.length < 5) {
      errors.address = ["Address must be at least 5 characters long."];
    }
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = [
        "Valid coordinates are required. Please allow location access and try again.",
      ];
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = [
        "Valid coordinates are required. Please allow location access and try again.",
      ];
    }
    if (
      deliveryRadiusKm !== null &&
      (isNaN(deliveryRadiusKm) || deliveryRadiusKm <= 0)
    ) {
      errors.deliveryRadiusKm = [
        "Delivery radius must be a valid number greater than 0.",
      ];
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Validation failed.", errors };
    }

    // First location for a business is always primary. Every path that
    // reaches here for a business's 2nd+ location already passed the tier
    // gate above, so isPrimary is simply "is this the first one".
    const isPrimary = currentLocationCount === 0;

    await prisma.location.create({
      data: {
        businessId: business.id,
        name,
        address,
        latitude,
        longitude,
        deliveryRadiusKm,
        isPrimary,
        isActive: true,
      },
    });

    revalidatePath(`/business/${slug}/locations`);
    revalidatePath(`/business/${slug}/settings`);

    return {
      success: true,
      message: "Location added successfully.",
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
