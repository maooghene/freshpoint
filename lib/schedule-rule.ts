// src/lib/schedule-rule.ts

interface BusinessScheduleRow {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Validates if a requested booking slot falls within the shop's live operating limits
 * @param targetDate The exact arrival timestamp the customer selected
 * @param storeSchedules The live array returned from your BusinessSchedule table
 */
export function isStoreOpen(
  targetDate: Date,
  storeSchedules: BusinessScheduleRow[],
): boolean {
  // Convert standard numeric weekdays to match your uppercase string schema (e.g., 0 -> "SUNDAY")
  const daysMap = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const targetDayString = daysMap[targetDate.getDay()];

  // Locate the calendar restriction row for that specific day
  const dayRule = storeSchedules.find((s) => s.day === targetDayString);

  // Guard clause: If there is no rule or if the shop toggle is switched off, block the checkout
  if (!dayRule || dayRule.isClosed) return false;

  // Convert the target date object into a clean "HH:MM" text string format
  const hours = targetDate.getHours().toString().padStart(2, "0");
  const minutes = targetDate.getMinutes().toString().padStart(2, "0");
  const targetTimeStr = `${hours}:${minutes}`;

  // Return true only if the arrival window falls within the custom time settings
  return (
    targetTimeStr >= dayRule.openTime && targetTimeStr <= dayRule.closeTime
  );
}
