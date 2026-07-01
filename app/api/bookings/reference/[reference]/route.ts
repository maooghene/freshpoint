import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    // 1️⃣ Resolve parameters cleanly matching Next.js 15 asynchronous paradigm shifts
    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing invoice transaction reference code" },
        { status: 400 },
      );
    }

    // 2️⃣ Extract the single booking tracking record matching your success types schema definitions
    const targetBookingRecord = await prisma.booking.findUnique({
      where: {
        paymentReference: reference, // Using findUnique is faster and safer since this column is @unique
      },
      select: {
        id: true,
        startTime: true,
        totalAmount: true,
        status: true,

        // Maps down into business parent name properties matching success layout interface requirements
        business: {
          select: {
            name: true,
          },
        },

        // Maps down into your primary treatment list elements
        items: {
          take: 1,
          select: {
            item: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 3️⃣ Fallback error handling if transaction code is invalid
    if (!targetBookingRecord) {
      return NextResponse.json(
        { error: "Booking record reference tracking code not found" },
        { status: 404 },
      );
    }

    // 4️⃣ Flatten structure object parameters to cleanly feed into your frontend SuccessBookingDetails props map
    const responsePayload = {
      id: targetBookingRecord.id,
      startTime: targetBookingRecord.startTime,
      totalAmount: targetBookingRecord.totalAmount,
      paymentStatus: targetBookingRecord.status,
      business: {
        name: targetBookingRecord.business.name,
      },
      item: {
        name:
          targetBookingRecord.items[0]?.item?.name ||
          "Premium Wellness Service",
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "CRITICAL SUCCESS PATH ROUTE VERIFICATION EXCEPTION ERROR:",
      error,
    );
    const fallbackMessage =
      error instanceof Error
        ? error.message
        : "Internal transaction audit failure";
    return NextResponse.json({ error: fallbackMessage }, { status: 500 });
  }
}
