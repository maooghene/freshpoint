import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  try {
    // 1. Edge Security Token Verification Check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    // Broaden the window slightly to catch any booking in the 23-to-24 hour window
    const twentyFourHoursAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyThreeHoursAhead = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // 2. Fetch confirmed bookings sitting precisely in the 24-hour warning zone
    const actionableBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: {
          gte: twentyThreeHoursAhead,
          lte: twentyFourHoursAhead,
          // Correct field reference used to ensure accurate timestamp targeting
        },
      },
      include: {
        user: true,
        business: true,
        reminderLogs: true,
      },
    });

    let emailsSentCount = 0;
    const trackingSummary = [];

    // 3. Loop and execute dispatches sequentially
    for (const booking of actionableBookings) {
      // Check if the 24-hour reminder milestone has already been logged
      const alreadySent = booking.reminderLogs.some(
        (log) => log.milestone === "24_HOUR",
      );
      if (alreadySent) continue;

      // 4. Fire notifications if the merchant allows email alerts
      if (booking.business.emailAlertsActive) {
        const timeStr = booking.startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateStr = booking.startTime.toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        const clientName = booking.user.firstName ?? "Valued Client";
        const vendorName = booking.business.name;

        // Client Dispatch Notification
        await resend.emails.send({
          from: "FreshPoint Alerts <onboarding@resend.dev>",
          to: booking.user.email,
          subject: `Reminder: Your booking with ${vendorName} is tomorrow`,
          html: `<p>Hi ${clientName}, this is a friendly reminder that your booking with <strong>${vendorName}</strong> is scheduled for tomorrow, ${dateStr} at ${timeStr}.</p>`,
        });

        // Vendor Dispatch Notification
        await resend.emails.send({
          from: "FreshPoint Studio <onboarding@resend.dev>",
          to: booking.business.email,
          subject: `Upcoming Session: Appointment with ${clientName} tomorrow`,
          html: `<p>Hello ${vendorName}, your appointment with client <strong>${clientName}</strong> is scheduled for tomorrow, ${dateStr} at ${timeStr}.</p>`,
        });

        emailsSentCount += 2;
      }

      // 5. Write to the database ledger to prevent duplicate sends
      await prisma.bookingReminderLog.create({
        data: {
          bookingId: booking.id,
          milestone: "24_HOUR",
        },
      });

      trackingSummary.push({ bookingId: booking.id });
    }

    return NextResponse.json({
      success: true,
      totalDispatched: emailsSentCount,
      bookingsProcessed: trackingSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
