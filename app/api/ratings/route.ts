import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// ✅ POST: Create a verified workspace rating and text review for Bookings OR Orders
export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Secure the endpoint via your Clerk authentication context
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Authentication required to review treatments or products" },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Active profile account records not found" },
        { status: 404 },
      );
    }

    // 2️⃣ Parse incoming submission payload fields
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Malformed request payload" },
        { status: 400 },
      );
    }

    // Unpack keys including the explicit itemId from our Split UI ReviewModal component
    const { rating, review, bookingId, businessId, itemId } = body;

    // Strict validation safety guards
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "A valid rating score between 1 and 5 stars is required" },
        { status: 400 },
      );
    }

    if (!bookingId || !businessId || !itemId) {
      return NextResponse.json(
        {
          error:
            "Missing required transactional mapping foreign keys (bookingId, businessId, itemId)",
        },
        { status: 400 },
      );
    }

    let fallbackAsOrder = false;

    // 3️⃣ STEP A: Try to evaluate reference ID against the Booking collection layer
    const verifiedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (verifiedBooking) {
      if (verifiedBooking.userId !== dbUser.id) {
        return NextResponse.json(
          {
            error:
              "Unauthorized. You can only rate your own completed bookings",
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

      // Verify the targeted itemId was actually part of this appointment reservation
      const doesItemExistInBooking = verifiedBooking.items.some(
        (item) => item.itemId === itemId,
      );

      if (!doesItemExistInBooking) {
        return NextResponse.json(
          {
            error:
              "The targeted service item is not linked to this booking slot",
          },
          { status: 400 },
        );
      }
    } else {
      // 3️⃣ STEP B: Fallback—if booking fails verification, resolve against the Marketplace Order collection layer
      fallbackAsOrder = true;
      const verifiedOrder = await prisma.order.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });

      if (!verifiedOrder) {
        return NextResponse.json(
          {
            error:
              "The targeted checkout transaction parameters do not exist on the platform",
          },
          { status: 404 },
        );
      }

      if (verifiedOrder.userId !== dbUser.id) {
        return NextResponse.json(
          {
            error:
              "Unauthorized. You can only rate items from your own transactions",
          },
          { status: 403 },
        );
      }

      // Accepts both standard completion strings or your DELIVERED order status tags
      const currentStatus = verifiedOrder.status.toUpperCase();
      if (currentStatus !== "COMPLETED" && currentStatus !== "DELIVERED") {
        return NextResponse.json(
          {
            error:
              "Orders must be fully delivered before posting catalog feedback reviews",
          },
          { status: 400 },
        );
      }

      // Verify the targeted itemId was actually part of this cart purchase group
      const doesItemExistInOrder = verifiedOrder.items.some(
        (line) => line.itemId === itemId,
      );

      if (!doesItemExistInOrder) {
        return NextResponse.json(
          {
            error:
              "The targeted catalog item was not found inside this transaction check line",
          },
          { status: 400 },
        );
      }
    }

    // 4️⃣ Execute database write operation inside your PostgreSQL schema instances
    const newRating = await prisma.rating.create({
      data: {
        rating: Number(rating),
        review: review?.trim() || null,
        userId: dbUser.id,
        businessId: businessId,
        itemId: itemId, // Links perfectly to the specific product/service reviewed
        bookingId: fallbackAsOrder ? null : bookingId,
      },
    });

    console.log(
      `🎉 [FreshPoint API] Feedback logged cleanly to Item [${itemId}] for User [${dbUser.id}]`,
    );

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
