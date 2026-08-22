import { prisma } from "@/lib/prisma";
import {
  zonedWallTimeToUtc,
  formatTimeInZone,
  addDaysToDateStr,
} from "@/lib/timezone";

interface SlotConfig {
  businessId: string;
  serviceDurationMinutes: number;
  dateStr: string;
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

  const effectiveCapacity = Math.max(business.staff.length, 1);

  const [year, month, day] = dateStr.split("-").map(Number);
  const referenceDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = referenceDate
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
    .toUpperCase();

  const daySchedule = business.schedules.find((s) => s.day === dayOfWeek);
  if (!daySchedule || daySchedule.isClosed) return [];

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

  // Enforce min-notice and max-ahead at the WINDOW level first — if the entire day
  // is out of range, skip the query and grid loop entirely.
  const now = new Date();
  const minAllowed = new Date(
    now.getTime() + business.minNoticeHours * 60 * 60 * 1000,
  );
  const maxAllowed = new Date(
    now.getTime() + business.maxAheadDays * 24 * 60 * 60 * 1000,
  );

  if (endWindow.getTime() < minAllowed.getTime()) return []; // whole day too soon
  if (startWindow.getTime() > maxAllowed.getTime()) return []; // whole day too far out

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

    // Per-slot min-notice check — skips individual slots too close to "now"
    // even on a day that's otherwise valid (e.g. booking later today).
    const passesMinNotice = currentSlotStart.getTime() >= minAllowed.getTime();

    const overlappingBookingsCount = existingBookings.filter((booking) => {
      const bStart = booking.startTime.getTime();
      const bEnd = booking.endTime.getTime();
      const sStart = currentSlotStart.getTime();
      const sEnd = currentSlotEnd.getTime();
      return sStart < bEnd && sEnd > bStart;
    }).length;

    if (passesMinNotice && overlappingBookingsCount < effectiveCapacity) {
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
