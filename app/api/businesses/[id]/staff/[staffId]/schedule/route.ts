import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DayOfWeek } from "@prisma/client";

// 1️⃣ Fix: Updated interface properties to match your schema naming ('day' and 'isOff')
interface SchedulePayloadItem {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; staffId: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: businessId, staffId } = params;

    const body = await req.json();
    const schedules: SchedulePayloadItem[] = body.schedules;

    // Authorization: Verify permissions safely
    const hasPermission = await prisma.business.findFirst({
      where: {
        id: businessId,
        OR: [
          { owner: { clerkId: userId } },
          { staff: { some: { id: staffId, user: { clerkId: userId } } } },
        ],
      },
    });

    if (!hasPermission)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2️⃣ Fix: Using your exact model property fields ('staffId', 'day', 'isOff')
    await prisma.$transaction([
      prisma.staffSchedule.deleteMany({
        where: {
          staffId: staffId,
        },
      }),
      prisma.staffSchedule.createMany({
        data: schedules.map((s: SchedulePayloadItem) => ({
          staffId: staffId, // Matches your foreign key string perfectly
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          isOff: s.isOff,
        })),
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Staff schedule processing failure:", error);
    return NextResponse.json(
      { error: "Failed to sync schedule rules" },
      { status: 500 },
    );
  }
}
