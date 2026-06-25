import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";

// ✅ PATCH: Handle inline meta updates for an existing workspace profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const businessId = await authOwner(clerkId);
    if (!businessId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, phone, address, description, email, sittingCapacity } =
      await request.json();

    const updatedProfile = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        address: address ? address.trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        description: description ?? undefined,
        sittingCapacity: sittingCapacity
          ? parseInt(sittingCapacity, 10)
          : undefined,
      },
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
