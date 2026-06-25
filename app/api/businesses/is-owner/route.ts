import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import

// ✅ GET: Verify if the authenticated session owns an active or pending workspace template
export async function GET() {
  try {
    // 1. Get Clerk ID using modern asynchronous App Router helper
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve internal sequential database User.id row from Clerk context log
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ isBusinessOwner: false }, { status: 200 });
    }

    // 3. Fetch the Business Workspace Profile
    const businessInfo = await prisma.business.findFirst({
      where: {
        ownerId: dbUser.id, // FIXED: Query bound securely using relational database ID index
      },
      include: {
        items: true, // FIXED: Migrated from services tracker parameter to pull multi-tenant items list
      },
    });

    if (!businessInfo) {
      return NextResponse.json({ isBusinessOwner: false }, { status: 200 });
    }

    // 4. Return the business info including the current status/isActive fields for onboarding checks
    return NextResponse.json(
      {
        isBusinessOwner: true,
        businessInfo,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Workspace Owner Verification API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
