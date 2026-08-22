import { prisma } from "@/lib/prisma";

// Helper function to handle background token refreshes
async function getValidGoogleAccessToken(
  businessId: string,
): Promise<string | null> {
  const credential = await prisma.googleCredential.findUnique({
    where: { businessId },
  });

  if (!credential) return null;

  const now = new Date();
  // Buffer of 5 minutes to prevent race conditions near expiration
  const safetyBufferTime = now.getTime() + 5 * 60 * 1000;

  // If the access token is still valid, use it directly
  if (credential.expiresAt.getTime() > safetyBufferTime) {
    return credential.accessToken;
  }

  // Token has expired or is about to expire -> Refresh it in the background
  try {
    const response = await fetch("https://googleapis.com", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: credential.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        `[GOOGLE REFRESH FAILURE] Could not refresh token for business ${businessId}:`,
        data,
      );
      return null;
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Persist the freshly generated access token back to our database
    const updated = await prisma.googleCredential.update({
      where: { businessId },
      data: {
        accessToken: data.access_token,
        expiresAt,
      },
    });

    return updated.accessToken;
  } catch (error) {
    console.error(
      `[GOOGLE REFRESH EXCEPTION] Error updating token for business ${businessId}:`,
      error,
    );
    return null;
  }
}

interface SyncEventConfig {
  bookingId: string;
}

// Main utility to sync a booking into the owner's Google Calendar
export async function syncBookingToGoogleCalendar({
  bookingId,
}: SyncEventConfig) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        user: true,
        items: { include: { item: true } }, // Fetches name of service
      },
    });

    if (!booking || booking.status !== "CONFIRMED") return;

    // Fetch or renew authorization access token
    const accessToken = await getValidGoogleAccessToken(booking.businessId);
    if (!accessToken) {
      console.log(
        `[CALENDAR SYNC SKIPPED] Business ${booking.businessId} has not paired Google Calendar.`,
      );
      return;
    }

    const firstBookingItem = booking.items?.[0];

    const serviceName = firstBookingItem?.itemId
      ? await prisma.item
          .findUnique({ where: { id: firstBookingItem.itemId } })
          .then((i) => i?.name)
      : "Wellness Session";
    const clientName = booking.user.firstName ?? "Valued Client";

    // Format fields for the Google Calendar event payload
    const eventBody = {
      summary: `${serviceName} with ${clientName}`,
      description: `FreshPoint Appointment\n\nClient Email: ${booking.user.email}\nNotes: ${booking.notes || "None"}`,
      start: {
        dateTime: booking.startTime.toISOString(),
        timeZone: booking.business.timezone,
      },
      end: {
        dateTime: booking.endTime.toISOString(),
        timeZone: booking.business.timezone,
      },
    };

    let url = "https://googleapis.com";
    let method = "POST";

    // If an event already exists (e.g., this is a rescheduled appointment), update it instead
    if (booking.googleEventId) {
      url = `${url}/${booking.googleEventId}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[GOOGLE CALENDAR API ERROR] Failed to push event:`, data);
      return;
    }

    // Save the returned googleEventId on the booking so we can modify or delete it later
    if (method === "POST" && data.id) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { googleEventId: data.id },
      });
      console.log(
        `✅ Google Calendar Event synced successfully for booking: ${bookingId}`,
      );
    }
  } catch (error) {
    console.error(`[GOOGLE CALENDAR EXCEPTION] Fatal sync failure:`, error);
  }
}
