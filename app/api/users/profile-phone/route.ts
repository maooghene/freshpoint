// app/api/users/profile-phone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ phone: null }, { status: 401 });
    }

    // 1. Check user profile internal record mapping
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ phone: null }, { status: 404 });
    }

    // 2. Query their latest order that contains a recorded phone number
    const latestOrder = await prisma.order.findFirst({
      where: { userId: user.id, customerPhone: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { customerPhone: true },
    });

    if (latestOrder?.customerPhone) {
      return NextResponse.json(
        { phone: latestOrder.customerPhone },
        { status: 200 },
      );
    }

    // 3. Fallback: Query their latest booking for a recorded phone number
    const latestBooking = await prisma.booking.findFirst({
      where: { userId: user.id, customerPhone: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { customerPhone: true },
    });

    return NextResponse.json(
      { phone: latestBooking?.customerPhone || null },
      { status: 200 },
    );
  } catch (error) {
    console.error("🔒 [PROFILE_PHONE_GET_ERROR]:", error);
    return NextResponse.json({ phone: null }, { status: 500 });
  }
}
