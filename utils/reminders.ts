import { prisma } from "@/lib/prisma";
import { syncBookingToGoogleCalendar } from "./googleCalendar";
import { hasBookingReminders } from "@/lib/subscription-tiers";

export async function queueBookingReminders(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true },
  });

  if (!booking || booking.status !== "CONFIRMED") return;
  if (!hasBookingReminders(booking.business.subscriptionTier)) {
    await prisma.bookingReminderLog.deleteMany({ where: { bookingId: booking.id, sentAt: null } });
    return;
  }

  // Trigger Google Calendar sync instantly (detached, never crashes the booking flow)
  syncBookingToGoogleCalendar({ bookingId: booking.id }).catch((err) =>
    console.error("Delayed async background calendar sync crashed:", err),
  );

  // Read the business's own configured reminder windows instead of hardcoding them.
  // Falls back to [48, 2] hours only if a business somehow has an empty array.
  const hoursConfig =
    booking.business.reminderMilestonesHours.length > 0
      ? booking.business.reminderMilestonesHours
      : [48, 2];

  // Only queue reminders that are still in the future. A booking made 3 hours
  // before it starts should not instantly get a "48 hours before" email too;
  // the booking confirmation already covers that.
  const nowMs = Date.now();
  const reminderData = hoursConfig
    .map((hours) => ({
      bookingId: booking.id,
      milestone: `${hours}_HOURS_BEFORE`,
      scheduledFor: new Date(
        booking.startTime.getTime() - hours * 60 * 60 * 1000,
      ),
      sentAt: null,
    }))
    .filter((reminder) => reminder.scheduledFor.getTime() > nowMs);

  await prisma.bookingReminderLog.deleteMany({
    where: { bookingId: booking.id, sentAt: null },
  });

  await prisma.bookingReminderLog.createMany({
    data: reminderData,
    skipDuplicates: true,
  });
}
