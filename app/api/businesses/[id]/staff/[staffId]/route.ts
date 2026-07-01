import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DayOfWeek } from "@prisma/client"; // 🔑 Import the strict enum types directly from Prisma

// 1️⃣ Enforce strict structural contracts matching your database schema properties exactly
interface IncomingScheduleItem {
  day: DayOfWeek; // 🛠️ Fix: Changed from string to DayOfWeek enum to satisfy typesafe assignments
  startTime: string;
  endTime: string;
  isOff: boolean;
}

// 🛠️ PATCH: Allow managers to update staff details (Name, Activation State, and Shifts Roster)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: businessId, staffId } = await params;
    const body = await request.json();
    const { name, isActive, schedules } = body;

    // Authorization: Verify the caller owns this business space
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

    // Dynamic data write updates object for core fields
    const updateData: { name?: string; isActive?: boolean } = {};
    if (typeof name === "string") updateData.name = name.trim();
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // Run atomically inside a transaction block if schedules are passed in the request
    if (Array.isArray(schedules)) {
      const typedSchedules = schedules as IncomingScheduleItem[];

      await prisma.$transaction([
        // Update basic text identifiers
        prisma.staffProfile.update({
          where: { id: staffId, businessId: business.id },
          data: updateData,
        }),
        // Wipe old shift intervals
        prisma.staffSchedule.deleteMany({
          where: { staffId },
        }),
        // Re-populate using strict types to satisfy the Prisma Client data contract requirements
        prisma.staffSchedule.createMany({
          data: typedSchedules.map((s: IncomingScheduleItem) => ({
            staffId,
            day: s.day, // 🛠️ Maps perfectly to your true DayOfWeek enum columns
            startTime: s.startTime,
            endTime: s.endTime,
            isOff: s.isOff ?? false,
          })),
        }),
      ]);
    } else {
      // Direct write fallback if the user is just editing name or active state switches
      await prisma.staffProfile.update({
        where: { id: staffId, businessId: business.id },
        data: updateData,
      });
    }

    // Fetch refreshed row snapshot to return to the client view
    const updatedStaff = await prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: { schedules: true },
    });

    return NextResponse.json(
      { success: true, staff: updatedStaff },
      { status: 200 },
    );
  } catch (error) {
    console.error("STAFF_PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// 🛠️ DELETE: Allow managers to remove a professional from the shop roster
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: businessId, staffId } = await params;

    // Authorization: Verify ownership check constraints
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
  } catch (error) {
    console.error("STAFF_DELETE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
