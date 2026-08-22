import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin"; // FIXED: Uses edge-safe backend location
import prisma from "@/lib/prisma"; // FIXED: Core default Prisma v7 import instance

// ✅ GET: Fetch all approved multi-tenant business rows for administrative oversight
export async function GET(request: NextRequest) {
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

    // 3. Fetch businesses with status 'approved'
    const businesses = await prisma.business.findMany({
      where: {
        status: "approved",
      },
      include: {
        owner: true,
      },
      orderBy: {
        ratings: {
          _count: "desc",
        },
      },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Error fetching admin approved businesses logs:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
