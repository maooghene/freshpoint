import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

async function handleStatusMutation(request: NextRequest, id: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Authentication validation required" },
        { status: 401 },
      );
    }

    // Pull internal database ID along with the email to evaluate roles and staff profiles
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Profile account match failure" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const { status } = body || {};

    if (!status) {
      return NextResponse.json(
        { error: "Missing updated status state property" },
        { status: 400 },
      );
    }

    // Verify ownership bounds before executing structural status change matrix updates
    const targetOrder = await prisma.order.findUnique({
      where: { id },
      select: { businessId: true, userId: true },
    });

    if (!targetOrder) {
      return NextResponse.json(
        { error: "Target order record trace missing" },
        { status: 404 },
      );
    }

    // CORRECTED: Match business ownerId against the user's internal CUID profile ID, not the Clerk ID string
    const merchantVerification = await prisma.business.findFirst({
      where: {
        id: targetOrder.businessId,
        ownerId: user.id,
      },
    });

    // Check 2: Is the current user an active staff member belonging to this business branch?
    const staffVerification = await prisma.staffProfile.findFirst({
      where: {
        businessId: targetOrder.businessId,
        email: { equals: user.email || "", mode: "insensitive" },
        isActive: true,
      },
    });

    // Master Authorization Multi-Tenant Matrix Check
    const isAuthorized =
      merchantVerification ||
      staffVerification ||
      targetOrder.userId === user.id;

    if (!isAuthorized) {
      console.warn(
        `🔒 Access Denied: User ID ${user.id} unauthorized for Order ID ${id}`,
      );
      return NextResponse.json(
        { error: "Forbidden tenant assignment profile boundaries" },
        { status: 403 },
      );
    }

    // Enforce matching capitalization schemas with database enum parameters
    const normalizedStatus = status.trim().toUpperCase() as OrderStatus;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: normalizedStatus },
    });

    console.log(
      `📊 [FreshPoint API] Order ID [${id}] state parameter transitioned safely to: ${normalizedStatus}`,
    );

    return NextResponse.json(
      {
        success: true,
        id: updatedOrder.id,
        status: updatedOrder.status,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const diagnostic =
      error instanceof Error ? error.message : "State change anomaly";
    console.error(
      `🚨 [FreshPoint API] Status adjustment fault trace: ${diagnostic}`,
    );
    return NextResponse.json(
      {
        error: "Internal transaction tracking server processing crash",
        details: diagnostic,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, props: ParamsProps) {
  const { id } = await props.params;
  return handleStatusMutation(request, id);
}

export async function POST(request: NextRequest, props: ParamsProps) {
  const { id } = await props.params;
  return handleStatusMutation(request, id);
}
