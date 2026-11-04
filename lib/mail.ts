import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Outgoing email over SMTP (nodemailer). Configure with environment variables:
 *   SMTP_HOST   e.g. smtp.gmail.com
 *   SMTP_PORT   587 (STARTTLS, default) or 465 (set SMTP_SECURE=true)
 *   SMTP_SECURE "true" for port 465
 *   SMTP_USER   SMTP login (usually the sending address)
 *   SMTP_PASS   SMTP password or app password
 *   MAIL_FROM   optional, e.g. "FreshPoint <alerts@yourdomain.com>"
 *               (falls back to COMPLAINTS_FROM_EMAIL, then SMTP_USER)
 *
 * Note: many providers (Gmail included) only allow the From address to be the
 * authenticated account, and rewrite anything else.
 */

const user = process.env.SMTP_USER;

export const FROM_EMAIL =
  process.env.MAIL_FROM ||
  process.env.COMPLAINTS_FROM_EMAIL ||
  (user ? `FreshPoint <${user}>` : "FreshPoint <no-reply@localhost>");

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

export interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Sends one email. Throws if SMTP is not configured or the server rejects the
 * message, so callers can decide whether to retry or carry on.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error(
      "Email is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS.",
    );
  }
  await getTransporter().sendMail({
    from: options.from ?? FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });
}
