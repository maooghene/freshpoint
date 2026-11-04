import { prisma } from "@/lib/prisma";
import { sendMail, FROM_EMAIL } from "@/lib/mail";
import { escapeHtml } from "@/lib/validation";

/**
 * Emails the customer after a business marks their appointment as a no-show.
 * Never throws: a mail problem must not undo the status change.
 */
export async function sendNoShowEmail(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        startTime: true,
        user: { select: { firstName: true, email: true } },
        business: {
          select: { name: true, slug: true, email: true, phone: true, timezone: true },
        },
      },
    });
    if (!booking?.user.email) return;

    const { business, user } = booking;
    const timeZone = business.timezone || "Africa/Lagos";
    const date = booking.startTime.toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    });
    const time = booking.startTime.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });
    const name = escapeHtml(user.firstName ?? "there");
    const shop = escapeHtml(business.name);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

    await sendMail({
      from: FROM_EMAIL,
      to: user.email,
      subject: `You missed your appointment with ${business.name}`,
      html: `
        <p>Hi ${name},</p>
        <p><strong>${shop}</strong> marked your appointment on <strong>${date} at ${time}</strong> as missed.</p>
        <p>As stated at checkout, payments are final and non-refundable, so a missed appointment is not refunded.</p>
        <p>If you think this is a mistake (for example you did attend), please contact ${shop} directly${
          business.phone ? ` on ${escapeHtml(business.phone)}` : ""
        } or reply with your booking reference <strong>${escapeHtml(booking.id)}</strong> and we will look into it.</p>
        ${baseUrl ? `<p>You can book again any time: <a href="${baseUrl}/explore/${encodeURIComponent(business.slug)}">${baseUrl}/explore/${escapeHtml(business.slug)}</a></p>` : ""}
        <p>— FreshPoint</p>`,
    });
  } catch (error) {
    console.error("NO_SHOW_EMAIL_FAILURE:", error);
  }
}
