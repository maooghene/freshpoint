import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 instance import
import { auth } from "@clerk/nextjs/server";

/* ================= COMPLIANT TYPES ================= */

type Day =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface ScheduleItem {
  day: Day;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/* ================= GET: Retrieve Workspace Operating Schedules ================= */

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json([], { status: 401 });
    }

    // Resolves structural calendar settings scoped to the logged-in user's business
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      include: { schedules: true }, // FIXED: Migrated from salon relational parameters
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      schedule: ScheduleItem[];
    };

    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Wellness space business profile not found" },
        { status: 404 },
      );
    }

    // 1️⃣ Clear existing operation schedules to refresh table metrics safely
    await prisma.businessSchedule.deleteMany({
      where: { businessId: business.id }, // FIXED: Replaced salonId tracking mapping parameters
    });

    // 2️⃣ Batch populate the fresh calendar records matching your database relations
    await prisma.businessSchedule.createMany({
      data: body.schedule.map((item) => ({
        businessId: business.id, // FIXED: Maps directly to your unified multi-tenant columns
        day: item.day,
        openTime: item.openTime,
        closeTime: item.closeTime,
        isClosed: item.isClosed,
      })),
    });

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
