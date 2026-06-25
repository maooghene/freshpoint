import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin"; // FIXED: Uses edge-safe backend location
import prisma from "@/lib/prisma"; // FIXED: Core default Prisma v7 import instance

// ✅ POST: Administrative toggle interface to safely activate or suspend business workspaces
export async function POST(request: NextRequest) {
  try {
    // 1. Get clerkId from Clerk authentication
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // 2. Check admin status
    const isAdmin = await authAdmin(clerkId);

    if (!isAdmin) {
      return NextResponse.json("Forbidden: Admin access required", {
        status: 403,
      });
    }

    // 3. Parse request body and validate businessId
    const { businessId } = await request.json(); // FIXED: Swapped 'salonId' tracking keys to 'businessId'

    if (!businessId) {
      return NextResponse.json("Business ID is required", { status: 400 });
    }

    // 4. Find the business record
    const business = await prisma.business.findUnique({
      where: { id: businessId }, // FIXED: Replaced salon find with business entity search
    });

    if (!business) {
      return NextResponse.json("Business workspace not found", { status: 404 });
    }

    // 5. Toggle isActive status parameters
    const updatedStatus = !business.isActive;
    await prisma.business.update({
      where: { id: businessId },
      data: {
        isActive: updatedStatus,
      },
    });

    return NextResponse.json(
      {
        message: `Business workspace ${updatedStatus ? "activated" : "deactivated"} successfully`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error toggling admin business activation status:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
