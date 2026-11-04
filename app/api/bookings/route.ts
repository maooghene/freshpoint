import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { handleGetBookingHistory } from "./controllers/getHistory";
import { handleCreateNewBooking } from "./controllers/createBooking";

export const dynamic = "force-dynamic";

/* =========================================================================
   GET: Retrieve Authenticated Client Order Transaction History
   ========================================================================= */
export async function GET(): Promise<NextResponse> {
  return handleGetBookingHistory();
}

/* =========================================================================
   POST: Create a Safe, Overlap-Validated Booking Slot Interceptor Pipeline
   ========================================================================= */
export async function POST(req: NextRequest): Promise<NextResponse> {
  {
    const limited = await rateLimit(req, RATE_LIMITS.bookingCreate);
    if (limited) return limited;
  }
  return handleCreateNewBooking(req);
}
