"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface RegisterState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    slug?: string[];
    email?: string[];
    phone?: string[];
    address?: string[];
    sittingCapacity?: string[];
  };
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

    const systemUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!systemUser) {
      return { success: false, message: "User account records missing." };
    }

    // Extract values cleanly
    const name = formData.get("name")?.toString().trim() || "";
    const slug = formData.get("slug")?.toString().trim().toLowerCase() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || null;

    const sittingCapacityRaw = formData.get("sittingCapacity");
    const sittingCapacity = sittingCapacityRaw
      ? parseInt(sittingCapacityRaw.toString(), 10)
      : 1;

    // Structural Server-Side Assertions
    const errors: Record<string, string[]> = {};
    if (name.length < 2)
      errors.name = ["Shop name must be at least 2 characters long."];
    if (!/^[a-z0-9-]+$/.test(slug))
      errors.slug = [
        "Slug can only contain lowercase letters, numbers, and hyphens.",
      ];
    if (!email.includes("@"))
      errors.email = ["Please input a valid email address."];
    if (phone.length < 7)
      errors.phone = ["Phone number must be at least 7 characters long."];
    if (address.length < 5)
      errors.address = ["Full corporate workspace street address required."];
    if (isNaN(sittingCapacity) || sittingCapacity < 1)
      errors.sittingCapacity = ["Capacity must be 1 or higher."];

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Validation parameters failed.",
        errors,
      };
    }

    // Check slug uniqueness collision parameters
    const duplicate = await prisma.business.findUnique({ where: { slug } });
    if (duplicate) {
      return {
        success: false,
        message: "Validation failed.",
        errors: {
          slug: [
            "This URL slug token is already registered by another merchant.",
          ],
        },
      };
    }

    // Insert atomic transaction
    await prisma.business.create({
      data: {
        name,
        slug,
        email,
        phone,
        address,
        sittingCapacity,
        description,
        status: "pending",
        isActive: false,
        ownerId: systemUser.id,
      },
    });

    return {
      success: true,
      message: slug, // Return slug back to component upon successful creation to handle direct client push routing
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Unknown error occurred.";
    return { success: false, message: `Database transaction crash: ${msg}` };
  }
}
