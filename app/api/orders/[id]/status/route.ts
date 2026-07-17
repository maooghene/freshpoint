import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

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

    const business = await prisma.business.findUnique({
      where: { id: targetOrder.businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business record trace missing" },
        { status: 404 },
      );
    }

    const businessAuthorized = await authorizeBusinessAccess({
      businessId: targetOrder.businessId,
      ownerId: business.ownerId,
      systemUserId: user.id,
      allowStaff: true,
    });

    const isAuthorized = businessAuthorized || targetOrder.userId === user.id;

    if (!isAuthorized) {
      console.warn(
        `🔒 Access Denied: User ID ${user.id} unauthorized for Order ID ${id}`,
      );
      return NextResponse.json(
        { error: "Forbidden tenant assignment profile boundaries" },
        { status: 403 },
      );
    }

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
