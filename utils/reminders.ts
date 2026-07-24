import { prisma } from "@/lib/prisma";
import { syncBookingToGoogleCalendar } from "./googleCalendar"; // 🚀 Import calendar sync

export async function queueBookingReminders(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true },
  });

  if (!booking || booking.status !== "CONFIRMED") return;

  // 🚀 TRIGGER GOOGLE CALENDAR SYNC INSTANTLY
  // Wrapped in a detached promise catch block so calendar failures NEVER crash your booking flow
  syncBookingToGoogleCalendar({ bookingId: booking.id }).catch((err) =>
    console.error("Delayed async background calendar sync crashed:", err),
  );

  // --- Your existing reminder calculation code below remains completely untouched ---
  const reminderTiers = [
    { milestone: "1_DAY", minutesBefore: 24 * 60 },
    { milestone: "2_HOURS", minutesBefore: 2 * 60 },
    { milestone: "30_MINUTES", minutesBefore: 30 },
    { milestone: "5_MINUTES", minutesBefore: 5 },
  ];

  const reminderData = reminderTiers.map((tier) => {
    const scheduledTime = new Date(
      booking.startTime.getTime() - tier.minutesBefore * 60 * 1000,
    );
    return {
      bookingId: booking.id,
      milestone: tier.milestone,
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
