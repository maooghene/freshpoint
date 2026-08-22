interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Converts a human-readable address into latitude and longitude
 * using OpenStreetMap Nominatim.
 */
export async function geocodeAddress(
  addressText: string,
): Promise<Coordinates | null> {
  try {
    const cleanAddress = addressText.trim();

    if (!cleanAddress) {
      return null;
    }

    const searchQuery = cleanAddress.toLowerCase().includes("nigeria")
      ? cleanAddress
      : `${cleanAddress}, Nigeria`;

    let coordinates = await fetchOsmCoordinates(searchQuery);

    if (coordinates) {
      return coordinates;
    }

    // Fallback: Try using only the broader location
    const addressParts = cleanAddress
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (addressParts.length > 1) {
      coordinates = await fetchOsmCoordinates(
        `${addressParts.slice(1).join(", ")}, Nigeria`,
      );

      if (coordinates) {
        return coordinates;
      }
    }

    // Final fallback: Search only the last segment (usually city/state)
    const lastSegment = addressParts[addressParts.length - 1];

    if (lastSegment) {
      return await fetchOsmCoordinates(`${lastSegment}, Nigeria`);
    }

    return null;
  } catch (error) {
    console.error("GEOCODING_ERROR:", error);
    return null;
  }
}

/**
 * Performs a Nominatim geocoding lookup.
 */
async function fetchOsmCoordinates(query: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query,
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "FreshPointMarketplace/1.0",
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      console.error(
        "NOMINATIM_RESPONSE_ERROR:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
    };
  } catch (error) {
    console.error("NOMINATIM_FETCH_ERROR:", error);
    return null;
  }
}

/**
 * Calculates the straight-line distance between two coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  origin: Coordinates,
  destination: Coordinates,
): number {
  const earthRadiusKm = 6371;

  const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;

  const dLng = ((destination.longitude - origin.longitude) * Math.PI) / 180;

  const lat1 = (origin.latitude * Math.PI) / 180;
  const lat2 = (destination.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}
