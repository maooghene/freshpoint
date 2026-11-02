// app/api/businesses/staff/[id]/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { parseJsonBody } from "@/lib/validation";
import { dayOfWeekSchema } from "@/lib/schemas";

const timeSchema = z
  .string()
  .trim()
  .max(8)
  .regex(/^(\d{1,2}:\d{2})?$/);

const scheduleBodySchema = z.object({
  schedule: z
    .array(
      z.object({
        day: dayOfWeekSchema,
        startTime: timeSchema,
        endTime: timeSchema,
        isOff: z.boolean().optional().default(false),
      }),
    )
    .max(7),
});

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

    const parsed = await parseJsonBody(req, scheduleBodySchema);
    if (!parsed.ok) return parsed.response;
    const { schedule } = parsed.data;

    const systemUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!systemUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization: only the business owner (or a verified admin
    // impersonation session) or the staff member themselves may change a
    // staff schedule. Being signed in is not enough.
    const staff = await prisma.staffProfile.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        userId: true,
        businessId: true,
        business: { select: { ownerId: true } },
      },
    });
    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    const isSelf = staff.userId !== null && staff.userId === systemUser.id;
    const authorized =
      isSelf ||
      (await authorizeBusinessAccess({
        businessId: staff.businessId,
        ownerId: staff.business.ownerId,
        systemUserId: systemUser.id,
        allowStaff: false,
      }));
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(
      schedule.map((day) =>
        prisma.staffSchedule.upsert({
          where: { staffId_day: { staffId, day: day.day } },
          update: {
            startTime: day.startTime,
            endTime: day.endTime,
            isOff: day.isOff,
          },
          create: {
            staffId,
            day: day.day,
            startTime: day.startTime,
            endTime: day.endTime,
            isOff: day.isOff,
          },
        }),
      ),
    );

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
