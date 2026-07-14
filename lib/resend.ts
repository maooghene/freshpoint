import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "RESEND_API_KEY is not set — complaint email notifications will fail silently.",
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.COMPLAINTS_FROM_EMAIL ||
  "FreshPoint Alerts <alerts@freshpoint.app>";
