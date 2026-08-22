// lib/notify-business.ts
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";
import webpush from "web-push";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:support@freshpoint.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface NotifyPayload {
  businessId: string;
  title: string;
  body: string;
  url: string;
  emailSubject: string;
  emailHtml: string;
}

async function sendPushToBusiness(
  businessId: string,
  title: string,
  body: string,
  path: string,
) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const [subscriptions, business] = await Promise.all([
    prisma.pushSubscription.findMany({ where: { businessId } }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { slug: true },
    }),
  ]);

  if (subscriptions.length === 0 || !business) return;

  const url = `/business/${business.slug}${path}`;

  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404/410 means the browser revoked this subscription (uninstalled,
        // cleared data, etc.) — clean it up so we stop trying forever.
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        } else {
          console.error("Web push send failed:", err);
        }
      }
    }),
  );
}

async function sendEmailToBusiness(
  businessId: string,
  subject: string,
  html: string,
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { email: true, emailAlertsActive: true, slug: true },
  });

  if (!business || !business.emailAlertsActive || !business.email) return;

  const htmlWithLink = html.replace("__BUSINESS_SLUG__", business.slug);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: business.email,
      subject,
      html: htmlWithLink,
    });
  } catch (err) {
    console.error(
      "Failed to send business notification email via Resend:",
      err,
    );
  }
}

async function notifyBusiness(payload: NotifyPayload) {
  // Fire both channels concurrently and never throw — this must never block
  // or fail the customer-facing order/booking response.
  await Promise.allSettled([
    sendPushToBusiness(
      payload.businessId,
      payload.title,
      payload.body,
      payload.url,
    ),
    sendEmailToBusiness(
      payload.businessId,
      payload.emailSubject,
      payload.emailHtml,
    ),
  ]);
}

export async function notifyBusinessNewOrder(params: {
  businessId: string;
  orderCode: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  isDelivery: boolean;
}) {
  const { businessId, orderCode, customerName, totalAmount, isDelivery } =
    params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  await notifyBusiness({
    businessId,
    title: "New order received",
    body: `${customerName} just placed a ${isDelivery ? "delivery" : "pickup"} order — ₦${totalAmount.toLocaleString()}`,
    url: `/orders`,
    emailSubject: `🛍️ New Order ${orderCode} — ₦${totalAmount.toLocaleString()}`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color:#111;">New Order Received</h2>
        <p><strong>Order:</strong> ${orderCode}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Fulfillment:</strong> ${isDelivery ? "Home Delivery" : "Store Pickup"}</p>
        <p><strong>Total:</strong> ₦${totalAmount.toLocaleString()}</p>
        <p style="margin-top:20px;">
          <a href="${appUrl}/business/__BUSINESS_SLUG__/orders" style="background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Open Dashboard
          </a>
        </p>
      </div>
    `,
  });
}

export async function notifyBusinessNewBooking(params: {
  businessId: string;
  queueCode: string;
  bookingId: string;
  customerName: string;
  totalAmount: number;
  startTime: Date;
}) {
  const { businessId, queueCode, customerName, totalAmount, startTime } =
    params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const formattedTime = startTime.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });

  await notifyBusiness({
    businessId,
    title: "New booking received",
    body: `${customerName} just booked an appointment for ${formattedTime}`,
    url: `/bookings`,
    emailSubject: `📅 New Booking ${queueCode} — ${formattedTime}`,
    emailHtml: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color:#111;">New Booking Received</h2>
        <p><strong>Voucher:</strong> ${queueCode}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Appointment:</strong> ${formattedTime}</p>
        <p><strong>Total:</strong> ₦${totalAmount.toLocaleString()}</p>
        <p style="margin-top:20px;">
          <a href="${appUrl}/business/__BUSINESS_SLUG__/bookings" style="background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Open Dashboard
          </a>
        </p>
      </div>
    `,
  });
}
