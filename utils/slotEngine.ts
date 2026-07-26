import { prisma } from "@/lib/prisma";
import {
  zonedWallTimeToUtc,
  formatTimeInZone,
  addDaysToDateStr,
} from "@/lib/timezone";

interface SlotConfig {
  businessId: string;
  serviceDurationMinutes: number;
  dateStr: string; // "YYYY-MM-DD"
}

export async function getAvailableSlots({
  businessId,
  serviceDurationMinutes,
  dateStr,
}: SlotConfig) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      schedules: true,
      staff: true,
    },
  });

  if (!business) throw new Error("Business not found");

  const totalStaffCount = business.staff.length;
  if (totalStaffCount === 0) return [];

  // Determine the day of week from the calendar date itself — this part was never
  // timezone-sensitive, since a calendar date doesn't shift based on wall-clock offset.
  const [year, month, day] = dateStr.split("-").map(Number);
  const referenceDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = referenceDate
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
    .toUpperCase();

  const daySchedule = business.schedules.find((s) => s.day === dayOfWeek);
  if (!daySchedule || daySchedule.isClosed) return [];

  // Convert the business's LOCAL wall-clock open/close times into true UTC instants
  const startWindow = zonedWallTimeToUtc(
    dateStr,
    daySchedule.openTime,
    business.timezone,
  );
  const endWindow = zonedWallTimeToUtc(
    dateStr,
    daySchedule.closeTime,
    business.timezone,
  );

  // Bound the existing-bookings query to the full LOCAL calendar day, not the UTC day
  const dayStart = zonedWallTimeToUtc(dateStr, "00:00", business.timezone);
  const nextDateStr = addDaysToDateStr(dateStr, 1);
  const dayEndExclusive = zonedWallTimeToUtc(
    nextDateStr,
    "00:00",
    business.timezone,
  );

  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: dayStart, lt: dayEndExclusive },
    },
    select: { startTime: true, endTime: true, staffId: true },
  });

  const availableSlots: string[] = [];
  const gridIntervalMinutes = 15;
  const totalServiceTimeNeeded =
    serviceDurationMinutes + business.bufferTimeMinutes;

  let currentSlotStart = new Date(startWindow.getTime());

  while (
    currentSlotStart.getTime() + totalServiceTimeNeeded * 60 * 1000 <=
    endWindow.getTime()
  ) {
    const currentSlotEnd = new Date(
      currentSlotStart.getTime() + totalServiceTimeNeeded * 60 * 1000,
    );

    const overlappingBookingsCount = existingBookings.filter((booking) => {
      const bStart = booking.startTime.getTime();
      const bEnd = booking.endTime.getTime();
      const sStart = currentSlotStart.getTime();
      const sEnd = currentSlotEnd.getTime();
      return sStart < bEnd && sEnd > bStart;
    }).length;

    if (overlappingBookingsCount < totalStaffCount) {
      // Format back into the business's LOCAL wall-clock time for display
      availableSlots.push(
        formatTimeInZone(currentSlotStart, business.timezone),
      );
    }

    currentSlotStart = new Date(
      currentSlotStart.getTime() + gridIntervalMinutes * 60 * 1000,
    );
  }

  return availableSlots;
}
