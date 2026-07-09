"use server";

import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface RegisterErrors {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  sittingCapacity?: string;
}

export interface RegisterState {
  success: boolean;
  message: string;
  errors?: RegisterErrors;
}

function isValidNigerianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s+/g, "");
  const nigerianRegex = /^(?:\+?234|0)\d{9}$/;
  return nigerianRegex.test(cleanPhone);
}

export async function createBusiness(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        message: "Authentication required. Profile session context missing.",
      };
    }

    const name = formData.get("name") as string | null;
    const slug = formData.get("slug") as string | null;
    const email = formData.get("email") as string | null;
    const phone = formData.get("phone") as string | null;
    const address = formData.get("address") as string | null;
    const sittingCapacityRaw = formData.get("sittingCapacity") as string | null;
    const description = formData.get("description") as string | null;

    const latitudeRaw = formData.get("latitude") as string | null;
    const longitudeRaw = formData.get("longitude") as string | null;

    const errors: RegisterErrors = {};

    if (!name || name.trim().length < 3) {
      errors.name = "Shop Name must contain at least 3 characters.";
    }

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      errors.slug =
        "Slug must contain only lowercase alphanumeric characters and hyphens.";
    }

    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      errors.email = "Please supply a valid workspace email address pattern.";
    }

    if (!phone || !isValidNigerianPhone(phone)) {
      errors.phone =
        "Invalid format. Provide a standard Nigerian line (e.g., 08031234567).";
    }

    if (!address || address.trim().length < 5) {
      errors.address =
        "Please provide a valid physical drop pin address description.";
    }

    const sittingCapacity = sittingCapacityRaw
      ? parseInt(sittingCapacityRaw, 10)
      : 1;
    if (isNaN(sittingCapacity) || sittingCapacity < 1) {
      errors.sittingCapacity =
        "Global operational layout capacity must be at least 1.";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Validation parameters check failed.",
        errors,
      };
    }

    const internalUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!internalUser) {
      return {
        success: false,
        message:
          "No local relational user instance found matching your authentication context.",
      };
    }

    const duplicateSlug = await prisma.business.findUnique({
      where: { slug: slug as string },
    });

    if (duplicateSlug) {
      return {
        success: false,
        message: "Unique parameter restriction failed.",
        errors: {
          slug: "This specific marketplace URL slug identifier is already registered by another shop.",
        },
      };
    }

    const latitude = latitudeRaw ? parseFloat(latitudeRaw) : 6.5244;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw) : 3.3792;

    const newBusiness = await prisma.business.create({
      data: {
        name: (name as string).trim(),
        slug: (slug as string).toLowerCase().trim(),
        email: (email as string).toLowerCase().trim(),
        phone: phone as string,
        address: (address as string).trim(),
        sittingCapacity,
        description: description ? description.trim() : "",
        latitude,
        longitude,
        ownerId: internalUser.id,
      },
    });

    return { success: true, message: newBusiness.slug };
  } catch (error: unknown) {
    const errorTrace =
      error instanceof Error
        ? error.message
        : "Fatal Prisma operational failure context";
    return {
      success: false,
      message: `Failed to provision infrastructure: ${errorTrace}`,
    };
  }
}
