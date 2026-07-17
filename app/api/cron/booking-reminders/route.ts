export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    // ✅ OPTIMIZED: Capture everything scheduled for the upcoming 24 hours
    const twentyFourHoursAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const pendingReminders = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: {
          gte: now,
          lte: twentyFourHoursAhead,
        },
      },
      include: {
        user: true,
        business: true,
        reminderLogs: true,
      },
    });

    let emailsDispatched = 0;

    for (const booking of pendingReminders) {
      const alreadySent = booking.reminderLogs.some(
        (log) => log.milestone === "24_HOUR",
      );
      if (alreadySent) continue;

      if (booking.business.emailAlertsActive) {
        const timeString = booking.startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateString = booking.startTime.toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        const clientName = booking.user.firstName ?? "Valued Client";
        const vendorName = booking.business.name;

        await resend.emails.send({
          from: "FreshPoint Alerts <onboarding@resend.dev>",
          to: booking.user.email,
          subject: `Reminder: Your booking with ${vendorName} is today!`,
          html: `<p>Hi ${clientName}, this is a friendly reminder that your upcoming appointment with <strong>${vendorName}</strong> is scheduled for today, ${dateString} at ${timeString}.</p>`,
        });

        await resend.emails.send({
          from: "FreshPoint Studio <onboarding@resend.dev>",
          to: booking.business.email,
          subject: `Upcoming Session: Appointment with ${clientName} today`,
          html: `<p>Hello ${vendorName}, your session with client <strong>${clientName}</strong> is scheduled for today, ${dateString} at ${timeString}.</p>`,
        });

        emailsDispatched += 2;
      }

      await prisma.bookingReminderLog.create({
        data: {
          bookingId: booking.id,
          milestone: "24_HOUR",
        },
      });
    }

    return NextResponse.json({ success: true, emailsSent: emailsDispatched });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
