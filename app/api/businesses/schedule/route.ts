import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/* ================= COMPLIANT TYPES ================= */

type CompliantDayEnum =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface ScheduleItemPayload {
  day: CompliantDayEnum; // Matches your model field exactly
  openTime: string; // Matches your model field exactly
  closeTime: string; // Matches your model field exactly
  isClosed: boolean; // Flag used to check if the day is inactive
}

/* ================= GET: Retrieve Workspace Operating Schedules ================= */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json([], { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { owner: { clerkId } },
      include: { schedules: true },
    });

    return NextResponse.json(business?.schedules || [], { status: 200 });
  } catch (error: unknown) {
    console.error("GET_BUSINESS_SCHEDULE_ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}

/* ================= POST: Batch Update Operating Calendar Blocks ================= */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      schedule: ScheduleItemPayload[];
    };

    const business = await prisma.business.findFirst({
      where: { owner: { clerkId } },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Wellness space business profile not found" },
        { status: 404 },
      );
    }

    // Run atomically inside a transaction loop to protect multi-tenant database states
    await prisma.$transaction([
      // 1️⃣ Clear existing operation schedules safely
      prisma.businessSchedule.deleteMany({
        where: { businessId: business.id },
      }),

      // 2️⃣ Batch populate using your true schema names: 'day', 'openTime', and 'closeTime'
      prisma.businessSchedule.createMany({
        data: (body.schedule || []).map((item) => ({
          businessId: business.id,
          day: item.day, // 🛠️ Aligned with your Prisma Schema type fields
          openTime: item.openTime, // 🛠️ Aligned with your Prisma Schema type fields
          closeTime: item.closeTime, // 🛠️ Aligned with your Prisma Schema type fields
          isClosed: item.isClosed, // 🛠️ Aligned with your Prisma Schema type fields
        })),
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("POST_BUSINESS_SCHEDULE_ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to save operational schedule timeline", message },
      { status: 500 },
    );
  }
}
