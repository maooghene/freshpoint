export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasBookingReminders } from "@/lib/subscription-tiers";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { escapeHtml } from "@/lib/validation";

// Describes how far away the appointment really is when the email goes out.
// The job may run later than a reminder was scheduled for, so this uses the
// actual time remaining rather than the milestone's nominal hours.
const describeTimeUntil = (start: Date, now: Date): string => {
  const hours = Math.round((start.getTime() - now.getTime()) / 3_600_000);
  if (hours < 1) return "very soon";
  if (hours < 24) return `in about ${hours} hour${hours > 1 ? "s" : ""}`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in about ${days} days`;
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
      const { booking } = log;
      const { business, user } = booking;

      // Claim this reminder atomically so two overlapping runs of the job
      // (it is triggered every few minutes) can never email it twice.
      const claim = await prisma.bookingReminderLog.updateMany({
        where: { id: log.id, sentAt: null },
        data: { sentAt: now },
      });
      if (claim.count !== 1) continue;

      // The appointment has already started or passed (e.g. the job ran late):
      // a reminder is no use and would be misleading. Drop it from the queue.
      if (booking.startTime <= now) {
        await prisma.bookingReminderLog.update({
          where: { id: log.id },
          data: { sentAt: now },
        });
        continue;
      }

      if (!hasBookingReminders(business.subscriptionTier)) {
        await prisma.bookingReminderLog.update({
          where: { id: log.id },
          data: { sentAt: now },
        });
        continue;
      }

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

      const clientName = escapeHtml(user.firstName ?? "Valued Client");
      const vendorName = escapeHtml(business.name);
      const horizonText = describeTimeUntil(booking.startTime, now);

      try {
        // 2. Dispatch email notification to the CUSTOMER
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Reminder: Your booking with ${business.name} is ${horizonText}`,
          html: `<p>Hi ${clientName}, this is a friendly reminder that your upcoming appointment with <strong>${vendorName}</strong> is ${horizonText}, ${dateString} at ${timeString}.</p>`,
        });

        // 3. Dispatch email notification to the BUSINESS OWNER
        await resend.emails.send({
          from: FROM_EMAIL,
          to: business.email,
          subject: `Upcoming session: appointment with ${user.firstName ?? "a client"} ${horizonText}`,
          html: `<p>Hello ${vendorName}, your session with client <strong>${clientName}</strong> is scheduled for ${horizonText}, ${dateString} at ${timeString}.</p>`,
        });

        emailsDispatched += 2;
      } catch (emailError) {
        console.error(
          `Failed to dispatch email for log ID ${log.id}:`,
          emailError,
        );
        // Put it back in the queue so the next run retries it.
        await prisma.bookingReminderLog.update({
          where: { id: log.id },
          data: { sentAt: null },
        });
      }
    }

    return NextResponse.json({ success: true, emailsSent: emailsDispatched });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
