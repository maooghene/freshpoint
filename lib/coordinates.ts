/** The schema default for a business that never set its location (central Lagos). */
export const DEFAULT_LATITUDE = 6.5244;
export const DEFAULT_LONGITUDE = 3.3792;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Parses a latitude/longitude pair from form values. Returns null when either
 * is missing, not a number, or out of range, so callers can ignore it instead
 * of saving a bad position.
 */
export function parseCoordinates(
  latitudeRaw: unknown,
  longitudeRaw: unknown,
): Coordinates | null {
  const lat = String(latitudeRaw ?? "").trim();
  const lng = String(longitudeRaw ?? "").trim();
  if (lat === "" || lng === "") return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** True when a business still has the untouched default position. */
export function isDefaultLocation(c: Coordinates): boolean {
  return (
    Math.abs(c.latitude - DEFAULT_LATITUDE) < 0.0001 &&
    Math.abs(c.longitude - DEFAULT_LONGITUDE) < 0.0001
  );
}
