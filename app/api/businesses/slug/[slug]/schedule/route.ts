import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing business slug parameter" },
        { status: 400 },
      );
    }

    // Public lookup: Pull calendar constraints strictly based on the URL bar text token
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        schedules: {
          orderBy: { day: "asc" }, // Organizes rows chronologically
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business profile space not found" },
        { status: 404 },
      );
    }

    // Return only the schedule rules safely to the public storefront
    return NextResponse.json(
      { schedules: business.schedules },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUBLIC_STOREFRONT_SCHEDULE_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
