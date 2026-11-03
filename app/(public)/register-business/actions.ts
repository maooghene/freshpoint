"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import imagekit from "@/config/imageKit";
import { UserRole } from "@prisma/client";
import { analyzeBusinessIntentWithAI } from "./aiGate";
import { RegisterErrors } from "./types";
import { emailSchema, validateImageFile } from "@/lib/validation";

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
      .filter(Boolean)
      .slice(0, 10);

    const sittingCapacityRaw = formData.get("sittingCapacity");
    const sittingCapacity = sittingCapacityRaw
      ? parseInt(sittingCapacityRaw.toString(), 10)
      : 1;

    const errors: RegisterErrors = {};
    if (name.length < 2 || name.length > 120)
      errors.name = "Shop name must be between 2 and 120 characters.";
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 2 || slug.length > 60) {
      errors.slug =
        "Slug must be 2-60 characters: lowercase letters, numbers, and hyphens.";
    }
    if (!emailSchema.safeParse(email).success)
      errors.email = "Please input a valid email address.";
    if (phone.length < 7 || phone.length > 30 || !/^[+()\-\s\d]+$/.test(phone))
      errors.phone = "Phone number must be 7-30 digits (spaces, + and - allowed).";
    if (address.length < 5 || address.length > 300)
      errors.address = "Full street address required (5-300 characters).";
    if (description.length > 2000)
      errors.description = "Description must be 2000 characters or fewer.";
    if (
      isNaN(sittingCapacity) ||
      sittingCapacity < 1 ||
      sittingCapacity > 100000
    )
      errors.sittingCapacity = "Capacity must be between 1 and 100,000.";
    const imageError =
      imageFile instanceof File ? validateImageFile(imageFile, true) : "A storefront cover image upload is mandatory.";
    if (imageError) {
      errors.image = imageError;
    }
    if (categories.length === 0) {
      errors.category = "Please select at least one business category.";
    } else if (categories.length > 3) {
      errors.category = "You can select a maximum of 3 categories.";
    } else {
      // ADDED: validate against live, active BusinessCategory rows instead of a static array
      const matchedCategories = await prisma.businessCategory.findMany({
        where: {
          value: { in: categories },
          isActive: true,
        },
        select: { value: true },
      });
      const validValues = new Set(matchedCategories.map((c) => c.value));
      const allValid = categories.every((c) => validValues.has(c));

      if (!allValid) {
        errors.category = "One or more selected categories are invalid.";
      }
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
          schedules: {
            create: [
              {
                day: "MONDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: false,
              },
              {
                day: "TUESDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: false,
              },
              {
                day: "WEDNESDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: false,
              },
              {
                day: "THURSDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: false,
              },
              {
                day: "FRIDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: false,
              },
              {
                day: "SATURDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: false,
              },
              {
                day: "SUNDAY",
                openTime: "09:00",
                closeTime: "17:00",
                isClosed: true,
              },
            ],
          },
          staff: {
            create: {
              name: "Store Manager (Owner)",
              email: email, // Business email or systemUser email
              role: "Owner / Specialist",
              isActive: true, // Instantly active to take bookings
              userId: systemUser.id, // Links their workspace account boundary profile
            },
          },
        },
      }),
      // Only promote plain customers. Admins and platform staff must keep
      // their role when they register a shop.
      prisma.user.updateMany({
        where: { id: systemUser.id, role: UserRole.CUSTOMER },
        data: { role: UserRole.BUSINESS_OWNER },
      }),
    ]);

    return {
      success: true,
      message: "Registration completed successfully.",
      finalizedSlug: slug,
    };
  } catch (error: unknown) {
    console.error("REGISTER_BUSINESS_ERROR:", error);
    return {
      success: false,
      message: "Could not complete registration. Please try again.",
    };
  }
}
