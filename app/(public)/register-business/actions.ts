"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import imagekit from "@/config/imageKit";
import { UserRole } from "@prisma/client";
import { analyzeBusinessIntentWithAI } from "./aiGate";
import { RegisterErrors } from "./types";
import { VALID_CATEGORY_VALUES } from "@/lib/categories";

export interface RegisterState {
  success: boolean;
  message: string;
  isRejectedByFilter?: boolean;
  errors?: RegisterErrors;
  finalizedSlug?: string; // Explicit source of truth for the client
}

export async function createBusiness(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";

    if (!primaryEmail) {
      return {
        success: false,
        message: "Authentication context requires a verified email address.",
      };
    }

    let systemUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!systemUser) {
      systemUser = await prisma.user.findUnique({
        where: { email: primaryEmail },
      });
    }
    if (!systemUser) {
      return {
        success: false,
        message: "User account records missing. Please refresh.",
      };
    }

    const name = formData.get("name")?.toString().trim() || "";
    // Clean and validate configuration variables
    const slug = formData.get("slug")?.toString().trim().toLowerCase() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const imageFile = formData.get("image") as File | null;
    const categories = formData
      .getAll("categories")
      .map((c) => c.toString().trim().toUpperCase())
      .filter(Boolean);

    const sittingCapacityRaw = formData.get("sittingCapacity");
    const sittingCapacity = sittingCapacityRaw
      ? parseInt(sittingCapacityRaw.toString(), 10)
      : 1;

    const errors: RegisterErrors = {};
    if (name.length < 2)
      errors.name = "Shop name must be at least 2 characters long.";
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens.";
    }
    if (!email.includes("@"))
      errors.email = "Please input a valid email address.";
    if (phone.length < 7)
      errors.phone = "Phone number must be at least 7 characters long.";
    if (address.length < 5) errors.address = "Full street address required.";
    if (isNaN(sittingCapacity) || sittingCapacity < 1)
      errors.sittingCapacity = "Capacity must be 1 or higher.";
    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
      errors.image = "A storefront cover image upload is mandatory.";
    }
    if (categories.length === 0) {
      errors.category = "Please select at least one business category.";
    } else if (categories.length > 3) {
      errors.category = "You can select a maximum of 3 categories.";
    } else if (!categories.every((c) => VALID_CATEGORY_VALUES.includes(c))) {
      errors.category = "One or more selected categories are invalid.";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Validation parameters failed.",
        errors,
      };
    }

    const duplicate = await prisma.business.findUnique({ where: { slug } });
    if (duplicate) {
      return {
        success: false,
        message: "Validation failed.",
        errors: { slug: "This URL link is already registered." },
      };
    }

    const aiVettingResult = await analyzeBusinessIntentWithAI(
      name,
      description,
    );

    if (
      !aiVettingResult.isValidIndustry &&
      aiVettingResult.confidenceScore > 0.7
    ) {
      return {
        success: false,
        isRejectedByFilter: true,
        message: aiVettingResult.reason,
      };
    }

    const buffer = Buffer.from(await imageFile!.arrayBuffer());

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: `${Date.now()}-${slug}`,
      folder: "/businesses",
    });

    const optimizedImageUrl = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    // Enforce an atomic transaction model to prevent data fragmentation or half-updated roles
    await prisma.$transaction([
      prisma.business.create({
        data: {
          name,
          slug,
          email,
          phone,
          address,
          sittingCapacity,
          description: description || null,
          image: optimizedImageUrl,
          status: "approved",
          isActive: true,
          ownerId: systemUser.id,
          categories,
        },
      }),
      prisma.user.update({
        where: { id: systemUser.id },
        data: { role: UserRole.BUSINESS_OWNER },
      }),
    ]);

    return {
      success: true,
      message: "Registration completed successfully.",
      finalizedSlug: slug,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Unknown error occurred.";
    return { success: false, message: `Database transaction crash: ${msg}` };
  }
}
