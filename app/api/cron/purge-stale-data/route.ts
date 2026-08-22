import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ SECURITY GUARD: Verify the request is coming from your trusted automated scheduler
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized access blocked" },
        { status: 401 },
      );
    }

    // 2️⃣ RETENTION WINDOW CALCULATION: Calculate exactly 1 year ago from today
    const retentionCutoff = new Date();
    retentionCutoff.setFullYear(retentionCutoff.getFullYear() - 1);

    console.log(
      `🧹 DISK STORAGE MAINTENANCE: Sweeping data older than ${retentionCutoff.toISOString()}`,
    );

    // 3️⃣ ATOMIC PURGE TRANSACTION: Safely wipe old database records
    // Because your Prisma schema has `onDelete: Cascade` set up on your relation mappings,
    // deleting a Booking row will automatically clean up matching child join tables (like BookingItem) completely!
    const purgeSummary = await prisma.booking.deleteMany({
      where: {
        createdAt: {
          lt: retentionCutoff, // Less than 1 year old
        },
      },
    });

    console.log(
      `✅ DISK PURGE SUCCESSFUL: Removed ${purgeSummary.count} stale booking records from disk.`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Database pruning execution complete.",
        rowsDeleted: purgeSummary.count,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ CRITICAL DATABASE PURGE FAILURE:", error);
    return NextResponse.json(
      { error: "Database maintenance loop collapsed" },
      { status: 500 },
    );
  }
}
