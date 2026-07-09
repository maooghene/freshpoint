import { auth } from "@clerk/nextjs/server"; // CORRECTED: Swapped legacy getAuth with async server session evaluator
import { NextRequest, NextResponse } from "next/server";
import {
  BookingUpdatePayload,
  sanitizeSlug,
  processBookingStatusUpdate,
  getFormattedBookings,
} from "./services";

// ✅ POST: Allow verified vendors and operational staff to update states seamlessly
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BookingUpdatePayload = await request.json();
    if (!body.BookingId || !body.status) {
      return NextResponse.json(
        { error: "Missing parameters: BookingId or status designation" },
        { status: 400 },
      );
    }

    const result = await processBookingStatusUpdate(
      body.BookingId,
      body.status,
      clerkId,
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      { message: "Appointment status changed and updated successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("BUSINESS_BOOKING_STATUS_POST_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ✅ GET: Fetch all historic and live bookings formatted for frontend components
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth(); // CORRECTED: Async session retrieval
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get("slug");
    if (!rawSlug) {
      return NextResponse.json(
        { error: "Business slug parameter required" },
        { status: 400 },
      );
    }

    const slug = sanitizeSlug(rawSlug);
    const result = await getFormattedBookings(slug, clerkId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json({ bookings: result.data }, { status: 200 });
  } catch (error: unknown) {
    console.error("BUSINESS_BOOKINGS_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
