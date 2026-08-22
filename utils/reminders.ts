import { prisma } from "@/lib/prisma";
import { syncBookingToGoogleCalendar } from "./googleCalendar";

export async function queueBookingReminders(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true },
  });

  if (!booking || booking.status !== "CONFIRMED") return;

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

  const reminderData = hoursConfig.map((hours) => {
    const scheduledTime = new Date(
      booking.startTime.getTime() - hours * 60 * 60 * 1000,
    );
    return {
      bookingId: booking.id,
      milestone: `${hours}_HOURS_BEFORE`,
      scheduledFor: scheduledTime,
      sentAt: null,
    };
  });

  await prisma.bookingReminderLog.deleteMany({
    where: { bookingId: booking.id, sentAt: null },
  });

  await prisma.bookingReminderLog.createMany({
    data: reminderData,
    skipDuplicates: true,
  });
}
