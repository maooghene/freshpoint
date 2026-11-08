import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyAdminSession } from "@/lib/admin";

// Admin-only: sends one harmless test error to Sentry so you can confirm error
// monitoring is connected. Open /api/admin/monitoring-test while signed in as
// an admin, then look for "FreshPoint Sentry test" in your Sentry issues.
export async function GET() {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  Sentry.captureException(new Error("FreshPoint Sentry test"));
  await Sentry.flush(2000);

  return NextResponse.json({
    sent: true,
    note: Sentry.getClient()?.getOptions().dsn
      ? "Test error sent. Check your Sentry issues."
      : "No Sentry DSN is set, so nothing was sent. Add SENTRY_DSN in your hosting environment variables.",
  });
}
