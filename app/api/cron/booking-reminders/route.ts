export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to format milestones into reader-friendly text for emails
const formatMilestoneText = (milestone: string): string => {
  switch (milestone) {
    case "1_DAY":
      return "tomorrow";
    case "2_HOURS":
      return "in 2 hours";
    case "30_MINUTES":
      return "in 30 minutes";
    case "5_MINUTES":
      return "in 5 minutes";
    default:
      return "soon";
  }
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();

    // 1. Fetch pending logs scheduled for NOW or in the PAST that haven't been sent
    const dueReminders = await prisma.bookingReminderLog.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        sentAt: null, // Only fetch items still in the queue
        booking: {
          status: "CONFIRMED", // Safety check: ensure booking wasn't cancelled
        },
      },
      include: {
        booking: {
          include: {
            user: true,
            business: true,
          },
        },
      },
      take: 50, // Batch limit to safely manage serverless execution windows
    });

    let emailsDispatched = 0;

    for (const log of dueReminders) {
      const { booking, milestone } = log;
      const { business, user } = booking;

      // Skip processing if the business turned off email notifications entirely
      if (!business.emailAlertsActive) {
        // Mark as sent anyway so it drops out of the active processing queue
        await prisma.bookingReminderLog.update({
          where: { id: log.id },
          data: { sentAt: now },
        });
        continue;
      }

      const timeString = booking.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: business.timezone,
      });

      const dateString = booking.startTime.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: business.timezone,
      });

      const clientName = user.firstName ?? "Valued Client";
      const vendorName = business.name;
      const horizonText = formatMilestoneText(milestone);

      try {
        // 2. Dispatch email notification to the CUSTOMER
        await resend.emails.send({
          from: "FreshPoint Alerts <onboarding@resend.dev>",
          to: user.email,
          subject: `Reminder: Your booking with ${vendorName} is ${horizonText}!`,
          html: `<p>Hi ${clientName}, this is a friendly reminder that your upcoming appointment with <strong>${vendorName}</strong> is ${horizonText}, ${dateString} at ${timeString}.</p>`,
        });

        // 3. Dispatch email notification to the BUSINESS OWNER
        await resend.emails.send({
          from: "FreshPoint Studio <onboarding@resend.dev>",
          to: business.email,
          subject: `Upcoming Session: Appointment with ${clientName} ${horizonText}`,
          html: `<p>Hello ${vendorName}, your session with client <strong>${clientName}</strong> is scheduled for ${horizonText}, ${dateString} at ${timeString}.</p>`,
        });

        emailsDispatched += 2;
      } catch (emailError) {
        console.error(
          `Failed to dispatch email for log ID ${log.id}:`,
          emailError,
        );
        // Continue processing other records even if an email fails
      }

      // 4. Mark this specific queue milestone item as completed
      await prisma.bookingReminderLog.update({
        where: { id: log.id },
        data: { sentAt: now },
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
