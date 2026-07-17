import { NextRequest, NextResponse } from "next/server";
import { getActiveAnnouncementsForUser } from "@/lib/actions/announcements";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId") || undefined;

    const announcements = await getActiveAnnouncementsForUser(businessId);
    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    console.error("ACTIVE_ANNOUNCEMENTS_FETCH_ERROR:", error);
    return NextResponse.json({ announcements: [] }, { status: 200 });
  }
}
