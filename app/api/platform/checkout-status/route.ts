import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin";
import {
  getPlatformRules,
  countRecentBookings,
  dailyBookingLimitMessage,
  MAINTENANCE_MESSAGE,
} from "@/lib/platform-rules";

// Tells the browser whether it may show a Pay button (kind=booking|order) or
// whether the whole site should show the maintenance notice (no kind). The
// confirm routes enforce the same rules again on the server.
export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind");
  const rules = await getPlatformRules();

  if (rules.maintenanceModeActive) {
    const { isAdmin, isPlatformStaff } = await verifyAdminSession();
    if (!isAdmin && !isPlatformStaff) {
      return NextResponse.json({
        blocked: true,
        maintenance: true,
        message: MAINTENANCE_MESSAGE,
      });
    }
  }

  if (kind === "booking") {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) {
        const used = await countRecentBookings(user.id);
        if (used >= rules.maxDailyBookingsPerUser) {
          return NextResponse.json({
            blocked: true,
            maintenance: false,
            message: dailyBookingLimitMessage(rules.maxDailyBookingsPerUser),
          });
        }
      }
    }
  }

  return NextResponse.json({ blocked: false, maintenance: false, message: "" });
}
