// app/api/businesses/[id]/staff/[staffId]/schedule/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DayOfWeek } from "@prisma/client";

interface SchedulePayloadItem {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

// Next.js 15 Context Interface contract rules require wrapping dynamic params in a Promise
interface RouteContext {
  params: Promise<{
    id: string;
    staffId: string;
  }>;
}

export async function PUT(
  req: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🚀 Await the promise explicitly to extract route layout properties safely
    const { id: businessId, staffId } = await context.params;

    const body = await req.json();
    const schedules: SchedulePayloadItem[] = body.schedules;

    // Authorization Verification Check
    const hasPermission = await prisma.business.findFirst({
      where: {
        id: businessId,
        OR: [
          { owner: { clerkId: userId } },
          { staff: { some: { id: staffId, user: { clerkId: userId } } } },
        ],
      },
    });

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Atomically reset and override schedules inside a safe db transaction
    await prisma.$transaction([
      prisma.staffSchedule.deleteMany({
        where: {
          staffId: staffId,
        },
      }),
      prisma.staffSchedule.createMany({
        data: schedules.map((s: SchedulePayloadItem) => ({
          staffId: staffId,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          isOff: s.isOff,
        })),
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Transaction Error";
    console.error("Staff schedule processing failure:", errorMsg);

    return NextResponse.json(
      { error: "Failed to sync schedule rules", details: errorMsg },
      { status: 500 },
    );
  }
}
