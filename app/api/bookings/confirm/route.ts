import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // FIXED: Central default Prisma v7 import instance
import { BookingStatus } from "@prisma/client"; // Safe type-safe enum directly from Prisma

interface PaystackWebhookData {
  status: string;
  reference: string;
  amount: number;
  metadata?: {
    userId?: string;
    itemId?: string;
    businessId?: string;
    dateTime?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 },
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // 1️⃣ Verify payment transaction directly with Paystack API
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      },
    );

    const verifyData = await verifyResponse.json();

    if (
      !verifyResponse.ok ||
      !verifyData?.data ||
      verifyData.data.status !== "success"
    ) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const payment: PaystackWebhookData = verifyData.data;
    const metadata = payment.metadata;

    if (
      !metadata ||
      !metadata.userId ||
      !metadata.itemId ||
      !metadata.businessId ||
      !metadata.dateTime
    ) {
      return NextResponse.json(
        { error: "Missing or incomplete payment metadata metrics" },
        { status: 400 },
      );
    }

    // 2️⃣ Resolve internal sequential database User.id row from Clerk token context
    const user = await prisma.user.findUnique({
      where: {
        clerkId: metadata.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User identity profile not found in database logs",
          clerkId: metadata.userId,
        },
        { status: 400 },
      );
    }

    // 3️⃣ Prevent duplicate processing collisions
    const existingBooking = await prisma.booking.findUnique({
      where: {
        paymentReference: reference,
      },
    });

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        bookingId: existingBooking.id,
      });
    }

    // 4️⃣ Validate date strings safely before timestamp formatting checks
    const startTime = new Date(metadata.dateTime);

    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid formatting metadata dateTime parameter received",
          value: metadata.dateTime,
        },
        { status: 400 },
      );
    }

    // 5️⃣ Create verified booking row entry matching multi-tenant schema rules
    const booking = await prisma.booking.create({
      data: {
        startTime,
        // Configures default 1-hour appointment block duration tracking bounds safely
        endTime: new Date(startTime.getTime() + 60 * 60000),

        status: BookingStatus.CONFIRMED,
        locationType: "IN_SHOP",

        businessId: metadata.businessId, // FIXED: Replaced salonId with businessId
        itemId: metadata.itemId, // FIXED: Replaced serviceId with itemId

        userId: user.id,

        paymentReference: reference,
        paymentStatus: "paid",
        totalAmount: payment.amount / 100, // Converts local Paystack Kobo counts back into Naira values
      },
    });

    console.log("✅ Multi-tenant Booking created successfully:", booking.id);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    });
  } catch (error: unknown) {
    console.error("❌ Booking confirmation handler exception:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown data exception error";
    return NextResponse.json(
      {
        error: "Failed to confirm booking",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
