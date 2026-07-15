import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // CORRECTED: Swapped legacy getAuth with async server session evaluator
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";

// ✅ PATCH: Handle inline meta updates for an existing workspace profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await authOwner(clerkId);
    if (!businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid payload body request" },
        { status: 400 },
      );
    }

    const { name, phone, address, description, email, sittingCapacity } = body;

    // Build the database mutation update payload dynamically based on incoming variables
    const updateData: Record<string, unknown> = {};

    if (typeof name === "string") updateData.name = name.trim();
    if (typeof phone === "string") updateData.phone = phone.trim();
    if (typeof address === "string") updateData.address = address.trim();
    if (typeof email === "string")
      updateData.email = email.toLowerCase().trim();
    if (description !== undefined)
      updateData.description = description === "" ? null : description;

    if (sittingCapacity !== undefined && sittingCapacity !== null) {
      const parsedCapacity = parseInt(sittingCapacity, 10);
      if (!isNaN(parsedCapacity)) {
        updateData.sittingCapacity = parsedCapacity;
      }
    }

    const updatedProfile = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: "Workspace profile updated smoothly",
        business: updatedProfile,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH_BUSINESS_PROFILE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
