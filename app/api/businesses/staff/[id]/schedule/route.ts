// app/api/business/staff/[id]/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { DayOfWeek } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: staffId } = await params;
    const { schedule } = await req.json();

    // Upsert each day's schedule
    const upsertPromises = schedule.map(
      (day: {
        day: string;
        startTime: string;
        endTime: string;
        isOff: boolean;
      }) =>
        prisma.staffSchedule.upsert({
          where: {
            staffId_day: {
              staffId,
              day: day.day as DayOfWeek,
            },
          },
          update: {
            startTime: day.startTime,
            endTime: day.endTime,
            isOff: day.isOff,
          },
          create: {
            staffId,
            day: day.day as DayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            isOff: day.isOff,
          },
        }),
    );

    await Promise.all(upsertPromises);

    const updatedSchedules = await prisma.staffSchedule.findMany({
      where: { staffId },
    });

    return NextResponse.json({ schedules: updatedSchedules });
  } catch (error) {
    console.error("STAFF_SCHEDULE_UPDATE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
