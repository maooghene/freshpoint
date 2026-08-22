import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 💡 Standardized pluralized named connection instance
import { auth } from "@clerk/nextjs/server";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

interface ToggleItemPayload {
  itemId?: string;
  businessSlug?: string;
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Next.js 15 Async Params Parsing
    const params = await props.params;
    const businessId = params?.id;

    if (!businessId || businessId === "undefined" || businessId.trim() === "") {
      return NextResponse.json(
        { error: "Missing required business tracking identifier parameter" },
        { status: 400 },
      );
    }

    // 2. Authenticate the active caller session via Clerk
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Extract and parse the body payload parameters
    const body = (await request.json()) as ToggleItemPayload;
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing tracking item identifier" },
        { status: 400 },
      );
    }

    // 4. DATA FIREWALL LAYER: Verify business presence and tenant owner credentials
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business workspace not found" },
        { status: 404 },
      );
    }

    // Resolve system user profile match row safely out of Neon Postgres
    const systemUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!systemUser) {
      return NextResponse.json(
        { error: "Identity profile missing" },
        { status: 403 },
      );
    }

    // Block cross-tenant script tempering or parameters exploitation malicious leaks
    // Block cross-tenant script tampering, exploitation, or unauthorized access
    const authorized = await authorizeBusinessAccess({
      businessId: business.id,
      ownerId: business.ownerId,
      systemUserId: systemUser.id,
      allowStaff: false,
    });

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You are not authorized to alter this tenant's inventory.",
        },
        { status: 403 },
      );
    }

    // 5. Look up the specific item record to ensure it belongs to this business
    const targetItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, businessId: true, isActive: true },
    });

    if (!targetItem || targetItem.businessId !== businessId) {
      return NextResponse.json(
        {
          error: "Target item record not found within this workspace catalog.",
        },
        { status: 404 },
      );
    }

    // 6. ATOMIC TOGGLE MAPPING: Invert the current database row state flag directly
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        isActive: !targetItem.isActive,
      },
      select: { id: true, isActive: true },
    });

    return NextResponse.json(
      {
        success: true,
        itemId: updatedItem.id,
        isActive: updatedItem.isActive,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Critical item visibility mutation failure:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
