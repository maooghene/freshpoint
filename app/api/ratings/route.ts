import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// ✅ POST: Create a verified workspace rating and text review
export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Secure the endpoint via your Clerk authentication context
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Authentication required to review treatments" },
        { status: 401 },
      );
    }

    // Find the corresponding core application database user entry using clerkId
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Active profile account records not found" },
        { status: 404 },
      );
    }

    // 2️⃣ Parse and unwrap incoming submission fields from the modal body payload
    const body = await req.json();
    const { rating, review, bookingId, businessId } = body;

    // Strict validation safety guards
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "A valid rating score between 1 and 5 stars is required" },
        { status: 400 },
      );
    }

    if (!bookingId || !businessId) {
      return NextResponse.json(
        { error: "Missing required transactional mapping foreign keys" },
        { status: 400 },
      );
    }

    // 3️⃣ Verify the booking exists, belongs to this customer, and is completed
    const verifiedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true, // Fetch the join table items list
      },
    });

    if (!verifiedBooking) {
      return NextResponse.json(
        { error: "The targeted appointment tracking logs do not exist" },
        { status: 404 },
      );
    }

    if (verifiedBooking.userId !== dbUser.id) {
      return NextResponse.json(
        {
          error: "Unauthorized. You can only rate your own completed bookings",
        },
        { status: 403 },
      );
    }

    if (verifiedBooking.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Appointments must be marked completed before submitting reviews",
        },
        { status: 400 },
      );
    }

    // Extract the primary item ID linked to this session from your BookingItem entity array
    const primaryBookingItem = verifiedBooking.items[0];
    if (!primaryBookingItem) {
      return NextResponse.json(
        {
          error:
            "No services or catalog items were found attached to this booking slot",
        },
        { status: 400 },
      );
    }

    // 4️⃣ Execute database write operation inside your PostgreSQL schema instances
    const newRating = await prisma.rating.create({
      data: {
        rating: Number(rating),
        review: review?.trim() || null,
        userId: dbUser.id,
        businessId: businessId,
        bookingId: bookingId,
        itemId: primaryBookingItem.itemId, // Automatically links review to specific treatment/product
      },
    });

    return NextResponse.json(
      { message: "Review posted successfully", data: newRating },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("CRITICAL_RATINGS_POST_API_FAILURE:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown database mutation event";
    return NextResponse.json(
      {
        error: "Failed to securely save your workspace feedback profile",
        details: message,
      },
      { status: 500 },
    );
  }
}
