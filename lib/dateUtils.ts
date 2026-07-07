// lib/dateUtils.ts

/**
 * Parses a YYYY-MM-DD date string as LOCAL date (not UTC)
 * to prevent timezone offset shifting the day index.
 */
export function parseDateStringLocal(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

export const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

export function getDayNameFromDateString(dateString: string): DayName {
  const date = parseDateStringLocal(dateString);
  return DAY_NAMES[date.getDay()];
}
