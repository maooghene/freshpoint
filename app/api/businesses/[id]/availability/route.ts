import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/utils/slotEngine";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // "2026-07-24"
  const duration = searchParams.get("duration"); // e.g. 45 (minutes)

  if (!date || !duration) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    const slots = await getAvailableSlots({
      businessId: params.id,
      serviceDurationMinutes: parseInt(duration, 10),
      dateStr: date,
    });

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
