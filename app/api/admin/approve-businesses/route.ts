import authAdmin from "@/lib/authAdmin";
import { auth } from "@clerk/nextjs/server";
import  prisma  from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ✅ GET: Fetch both active and awaiting application tenant business row records
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch businesses based on active status filters matching schema default parameters
    const allBusinesses = await prisma.business.findMany({
      where: {
        status: {
          in: ["approved", "pending"],
        },
      },
      include: {
        owner: true, // Pulls nested User account records via your fields relationship link
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(allBusinesses);
  } catch (error) {
    console.error("Fetch Admin Businesses Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ POST: Handle verification updates (approving or rejecting application logs)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    // FIXED: Swapped 'salonId' parameter tracking mapping keys over to 'businessId'
    const { businessId, status } = body; // status parameters pass explicitly as 'approved' | 'rejected'

    if (!businessId || !status) {
      return NextResponse.json(
        { error: "Missing businessId or status designation" },
        { status: 400 },
      );
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        status: status,
        isActive: status === "approved", // Automatically locks operational access toggle states
      },
    });

    return NextResponse.json(
      {
        message: `Workspace successfully configured as ${status}`,
        business: updatedBusiness,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Workspace Verification Approval Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
