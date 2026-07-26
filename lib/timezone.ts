/**
 * Converts a wall-clock date + time in a given IANA timezone into the
 * correct absolute UTC Date instant.
 *
 * Example: zonedWallTimeToUtc("2026-07-25", "09:00", "Africa/Lagos")
 * returns the Date instant for 09:00 Lagos time, i.e. 08:00 UTC.
 */
export function zonedWallTimeToUtc(
  dateStr: string, // "YYYY-MM-DD"
  timeStr: string, // "HH:MM" or "HH:MM:SS"
  timeZone: string, // IANA tz, e.g. "Africa/Lagos"
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute, second = 0] = timeStr.split(":").map(Number);

  // Step 1: naively treat the wall-clock numbers as if they were UTC
  const guessUtc = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );

  // Step 2: find the target timezone's actual offset from UTC at that instant
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, guessUtc);

  // Step 3: shift the guess by that offset to get the true UTC instant
  return new Date(guessUtc.getTime() - offsetMinutes * 60_000);
}

/** Formats a UTC Date instant as an "HH:MM" wall-clock string in the given timezone. */
export function formatTimeInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Returns a timezone's offset from UTC, in minutes, at the given instant. */
function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return (asUTC - date.getTime()) / 60_000;
}

/** Adds `days` calendar days to a "YYYY-MM-DD" string, returning a new "YYYY-MM-DD" string. */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}
