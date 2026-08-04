import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DayOfWeek } from "@prisma/client";

interface IncomingScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId, staffId } = await params;
    const body = await request.json();
    const { name, isActive, schedules } = body;

    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
        owner: { clerkId: userId },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Workspace profile not found or forbidden" },
        { status: 403 },
      );
    }

    const updateData: { name?: string; isActive?: boolean; userId?: string } =
      {};
    if (typeof name === "string") updateData.name = name.trim();
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // 🔗 AUTO-LINK: If the owner is activating this staff member and the row
    // isn't linked to a real user account yet, check whether someone already
    // has a FreshPoint account under this staff row's email — e.g. they signed
    // up as a customer before ever being invited as staff. If so, link them
    // instantly here, rather than requiring the separate email-invite-link
    // flow (sync-staff-roster) to ever run for them.
    if (isActive === true) {
      const currentStaffRow = await prisma.staffProfile.findUnique({
        where: { id: staffId, businessId: business.id },
        select: { userId: true, email: true },
      });

      if (currentStaffRow && !currentStaffRow.userId) {
        const matchingUser = await prisma.user.findUnique({
          where: { email: currentStaffRow.email },
          select: { id: true },
        });

        if (matchingUser) {
          updateData.userId = matchingUser.id;
        }
        // If no matching user exists yet, userId stays unset here — they'll
        // still get linked normally the moment they sign in and hit
        // sync-staff-roster, same as the original invite flow.
      }
    }

    if (Array.isArray(schedules)) {
      const typedSchedules = schedules as IncomingScheduleItem[];

      await prisma.$transaction(async (tx) => {
        await tx.staffProfile.update({
          where: { id: staffId, businessId: business.id },
          data: updateData,
        });

        await tx.staffSchedule.deleteMany({
          where: { staffId },
        });

        await tx.staffSchedule.createMany({
          data: typedSchedules.map((s: IncomingScheduleItem) => ({
            staffId,
            day: String(s.day).trim().toUpperCase() as DayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isOff: s.isOff ?? false,
          })),
        });
      });
    } else {
      await prisma.staffProfile.update({
        where: { id: staffId, businessId: business.id },
        data: updateData,
      });
    }

    const updatedStaff = await prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: { schedules: true },
    });

    return NextResponse.json(
      { success: true, staff: updatedStaff },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("STAFF_PATCH_ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId, staffId } = await params;

    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
        owner: { clerkId: userId },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Workspace profile not found or forbidden" },
        { status: 403 },
      );
    }

    await prisma.staffProfile.delete({
      where: { id: staffId, businessId: business.id },
    });

    return NextResponse.json(
      { success: true, message: "Staff member removed successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("STAFF_DELETE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
