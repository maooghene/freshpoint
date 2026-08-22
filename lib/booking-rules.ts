import { zonedWallTimeToUtc } from "@/lib/timezone";

export interface BusinessScheduleRow {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function getDayNameForDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return DAY_NAMES[d.getUTCDay()];
}

/** Checks a requested booking window against the business's actual open/close hours. */
export function isWithinBusinessHours(
  dateStr: string,
  startTime: Date,
  endTime: Date,
  schedules: BusinessScheduleRow[],
  timezone: string,
): { isOpen: boolean; reason?: string } {
  const dayName = getDayNameForDate(dateStr);
  const daySchedule = schedules.find((s) => s.day === dayName);

  if (!daySchedule || daySchedule.isClosed) {
    return {
      isOpen: false,
      reason: "The business is closed on the selected day.",
    };
  }

  const openInstant = zonedWallTimeToUtc(
    dateStr,
    daySchedule.openTime,
    timezone,
  );
  const closeInstant = zonedWallTimeToUtc(
    dateStr,
    daySchedule.closeTime,
    timezone,
  );

  if (
    startTime.getTime() < openInstant.getTime() ||
    endTime.getTime() > closeInstant.getTime()
  ) {
    return {
      isOpen: false,
      reason: `This time falls outside business hours (${daySchedule.openTime}–${daySchedule.closeTime}).`,
    };
  }

  return { isOpen: true };
}

/** Checks a requested start time against the business's minimum notice and max-advance settings. */
export function isWithinBookingWindow(
  startTime: Date,
  minNoticeHours: number,
  maxAheadDays: number,
): { isValid: boolean; reason?: string } {
  const now = new Date();
  const minAllowed = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
  const maxAllowed = new Date(
    now.getTime() + maxAheadDays * 24 * 60 * 60 * 1000,
  );

  if (startTime.getTime() < minAllowed.getTime()) {
    return {
      isValid: false,
      reason: `This business requires at least ${minNoticeHours} hour(s) advance notice.`,
    };
  }

  if (startTime.getTime() > maxAllowed.getTime()) {
    return {
      isValid: false,
      reason: `This business only accepts bookings up to ${maxAheadDays} day(s) in advance.`,
    };
  }

  return { isValid: true };
}
