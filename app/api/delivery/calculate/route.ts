import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON request structure" }, { status: 400 });
    }

    const { businessId, destinationAddress } = body;

    if (!businessId || !destinationAddress || !destinationAddress.trim()) {
      return NextResponse.json({ error: "Missing calculation criteria parameters" }, { status: 400 });
    }

    // 1. Pull the business context profile to get default metrics if needed
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { address: true }
    });

    if (!business) {
      return NextResponse.json({ error: "Merchant record not found" }, { status: 404 });
    }

    /* 
      PRODUCTION ARCHITECTURE INTEGRATION:
      This is where we dispatch an internal fetch call to standard mapping layers:
      const mapsUrl = `https://googleapis.com{encodeURIComponent(business.address)}&destinations=${encodeURIComponent(destinationAddress)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    */

    // Senior simulated deterministic algorithm based on address character layout
    // This serves as an excellent zero-cost placeholder tracking pipeline
    const pseudoDistanceKm = Math.min(
      Math.max((destinationAddress.trim().length % 15) + 3, 2), 
      25
    );

    // Business Pricing Parameter Matrix 
    const baseFee = 500; // ₦500 Base start cost fee line
    const costPerKm = 120; // ₦120 per calculated road Kilometer distance

    const calculatedFee = baseFee + (pseudoDistanceKm * costPerKm);

    return NextResponse.json({
      success: true,
      distanceKm: pseudoDistanceKm,
      deliveryFee: Math.round(calculatedFee)
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Calculation pipeline drop: ${msg}` }, { status: 500 });
  }
}

