import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

// 🚀 BOTH HTTP METHODS SUPPORTED TO SECURE FRONTEND COMPLIANCE
async function handleStatusMutation(request: NextRequest, id: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Authentication validation required" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
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

    // Check if the current business exists and is managed by this user
    const merchantVerification = await prisma.business.findFirst({
      where: {
        id: targetOrder.businessId,
        ownerId: user.id,
      },
    });

    // Fallback block: Allow mutations if the request belongs to either the vendor manager OR the booking user
    const isAuthorized = merchantVerification || targetOrder.userId === user.id;
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden tenant assignment profile boundaries" },
        { status: 403 },
      );
    }

    // Enforce matching capitalization schemas with database enum parameters (e.g., PENDING, COMPLETED, PROCESSING)
    const normalizedStatus = status.trim().toUpperCase();

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

// Map both incoming PATCH requests cleanly
export async function PATCH(request: NextRequest, props: ParamsProps) {
  const { id } = await props.params;
  return handleStatusMutation(request, id);
}

// 🌟 ADDED RECOVERY FALLBACK: Converts POST method request routes to clean up 405 error blocks instantly
export async function POST(request: NextRequest, props: ParamsProps) {
  const { id } = await props.params;
  return handleStatusMutation(request, id);
}
