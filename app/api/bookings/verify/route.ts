import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing identity reference parameter" },
        { status: 400 },
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { isVerifiedByStaff: true },
    });

    return NextResponse.json(
      { success: true, updatedBooking },
      { status: 200 },
    );
  } catch (error) {
    console.error("Staff authorization verify exception:", error);
    return NextResponse.json(
      { error: "Verification adjustment exception caught" },
      { status: 500 },
    );
  }
}
