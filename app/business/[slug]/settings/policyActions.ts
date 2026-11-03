"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

export interface PolicyActionState {
  success: boolean;
  message: string;
  errors?: {
    minNoticeHours?: string[];
    maxAheadDays?: string[];
    cancelWindowHours?: string[];
    bufferTimeMinutes?: string[];
    customInvoiceNote?: string[];
    timezone?: string[];
    currencyCode?: string[];
  };
}

function isValidTimeZone(value: string): boolean {
  if (value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function updateBusinessPolicies(
  businessId: string,
  slug: string,
  prevState: PolicyActionState,
  formData: FormData,
): Promise<PolicyActionState> {
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
      select: { id: true, ownerId: true },
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
      allowStaff: false, // policies are owner-only, even for real staff
    });

    if (!authorized) {
      return {
        success: false,
        message: "Forbidden. You do not own this workspace.",
      };
    }

    // Extracted Fields & Conversions
    const minNoticeHours = parseInt(
      formData.get("minNoticeHours")?.toString() || "0",
      10,
    );
    const maxAheadDays = parseInt(
      formData.get("maxAheadDays")?.toString() || "30",
      10,
    );
    const cancelWindowHours = parseInt(
      formData.get("cancelWindowHours")?.toString() || "0",
      10,
    );
    const bufferTimeMinutes = parseInt(
      formData.get("bufferTimeMinutes")?.toString() || "0",
      10,
    );
    const timezone =
      formData.get("timezone")?.toString().trim() || "Africa/Lagos";
    const currencyCode =
      formData.get("currencyCode")?.toString().trim().toUpperCase() || "NGN";

    // Cleaned-Up Boolean Conversion (Matches the single checkbox value on your new form)
    const emailAlertsActive = formData.get("emailAlertsActive") === "true";

    const customInvoiceNote =
      formData.get("customInvoiceNote")?.toString().trim() || null;

    // Layman-Friendly Validation Checks
    const errors: Record<string, string[]> = {};

    if (isNaN(minNoticeHours) || minNoticeHours < 0 || minNoticeHours > 72) {
      errors.minNoticeHours = [
        "Please enter a booking notice window between 0 and 72 hours.",
      ];
    }
    if (isNaN(maxAheadDays) || maxAheadDays < 1 || maxAheadDays > 365) {
      errors.maxAheadDays = [
        "Calendar visibility limits must fall between 1 and 365 days.",
      ];
    }
    if (
      isNaN(cancelWindowHours) ||
      cancelWindowHours < 0 ||
      cancelWindowHours > 168
    ) {
      errors.cancelWindowHours = [
        "Cancellation deadlines must be between 0 and 168 hours.",
      ];
    }
    if (
      isNaN(bufferTimeMinutes) ||
      bufferTimeMinutes < 0 ||
      bufferTimeMinutes > 120
    ) {
      errors.bufferTimeMinutes = [
        "Rest time buffers between appointments must be between 0 and 120 minutes.",
      ];
    }
    if (!isValidTimeZone(timezone)) {
      errors.timezone = ["Please choose a valid timezone."];
    }
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      errors.currencyCode = ["Currency must be a 3-letter code such as NGN."];
    }
    if (customInvoiceNote && customInvoiceNote.length > 500) {
      errors.customInvoiceNote = [
        "Your custom customer note cannot exceed 500 characters.",
      ];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Please correct the highlighted form values.",
        errors,
      };
    }

    // Execute Database Ingestion matching your pristine Prisma models
    // Double check that your prisma.business.update structure inside policyActions.ts handles numbers safely:
    await prisma.business.update({
      where: { id: businessId },
      data: {
        minNoticeHours: isNaN(minNoticeHours) ? 2 : minNoticeHours,
        maxAheadDays: isNaN(maxAheadDays) ? 30 : maxAheadDays,
        cancelWindowHours: isNaN(cancelWindowHours) ? 24 : cancelWindowHours,
        bufferTimeMinutes: isNaN(bufferTimeMinutes) ? 0 : bufferTimeMinutes,
        timezone,
        currencyCode,
        emailAlertsActive,
        customInvoiceNote,
      },
    });

    revalidatePath(`/business/${slug}`);
    revalidatePath(`/business/${slug}/settings`);

    return {
      success: true,
      message: "Shop rules and preferences updated successfully.",
    };
  } catch (error: unknown) {
    console.error("UPDATE_BUSINESS_POLICIES_ERROR:", error);
    return {
      success: false,
      message: "Could not save your shop rules. Please try again.",
    };
  }
}
