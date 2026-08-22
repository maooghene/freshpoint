import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await params;
    if (!reference) {
      return NextResponse.json(
        { error: "Missing invoice transaction reference code" },
        { status: 400 },
      );
    }
    const targetBookingRecord = await prisma.booking.findUnique({
      where: {
        paymentReference: reference,
      },
      select: {
        id: true,
        startTime: true,
        totalAmount: true,
        status: true,
        business: {
          select: {
            name: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
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
    if (!targetBookingRecord) {
      return NextResponse.json(
        { error: "Booking record reference tracking code not found" },
        { status: 404 },
      );
    }
    const responsePayload = {
      id: targetBookingRecord.id,
      startTime: targetBookingRecord.startTime,
      totalAmount: targetBookingRecord.totalAmount,
      paymentStatus: targetBookingRecord.status,
      staffName: targetBookingRecord.staff?.name || null,
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
