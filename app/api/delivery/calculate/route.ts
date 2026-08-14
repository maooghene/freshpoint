import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistance, geocodeAddress } from "@/lib/geo";
import { getEffectiveDeliveryRadiusKm } from "@/lib/subscription-tiers";

interface DeliveryCalculateRequestBody {
  businessId: string;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DeliveryCalculateRequestBody = await req.json();

    const businessId = body.businessId?.trim();
    const destinationAddress = body.destinationAddress?.trim();
    const destinationLatitude = body.destinationLatitude;
    const destinationLongitude = body.destinationLongitude;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required." },
        { status: 400 },
      );
    }

    const hasDirectCoordinates =
      typeof destinationLatitude === "number" &&
      typeof destinationLongitude === "number" &&
      !Number.isNaN(destinationLatitude) &&
      !Number.isNaN(destinationLongitude);

    if (!hasDirectCoordinates && !destinationAddress) {
      return NextResponse.json(
        {
          error:
            "Provide either destinationLatitude/destinationLongitude (preferred) or a destinationAddress.",
        },
        { status: 400 },
      );
    }

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        latitude: true,
        longitude: true,
        baseDeliveryFee: true,
        deliveryFeePerKm: true,
        deliveryRadiusKm: true,
        subscriptionTier: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 },
      );
    }

    // Preferred path: frontend autocomplete picker already resolved exact
    // coordinates. This avoids Nominatim entirely (rate limits + poor
    // coverage of informal Nigerian/campus addresses are the reason the
    // fee was silently falling back to baseDeliveryFee on every request).
    let customerCoordinates: { latitude: number; longitude: number } | null =
      hasDirectCoordinates
        ? {
            latitude: destinationLatitude as number,
            longitude: destinationLongitude as number,
          }
        : null;

    // Legacy fallback path only: used if a raw address string is sent
    // without coordinates. Should become rare/unused once the frontend
    // picker is fully wired in.
    if (!customerCoordinates && destinationAddress) {
      customerCoordinates = await geocodeAddress(destinationAddress);
    }

    if (!customerCoordinates) {
      console.warn("DELIVERY_GEOCODE_FALLBACK_HIT", {
        businessId,
        destinationAddress,
      });

      return NextResponse.json({
        success: true,
        distanceKm: 0,
        deliveryFee: Math.round(business.baseDeliveryFee || 0),
        isFallback: true,
        outsideDeliveryZone: false,
        message:
          "Unable to determine delivery location. Base delivery fee applied.",
      });
    }

    const businessCoordinates = {
      latitude: business.latitude,
      longitude: business.longitude,
    };

    const distanceKm = calculateHaversineDistance(
      businessCoordinates,
      customerCoordinates,
    );

    const roundedDistance = Number(distanceKm.toFixed(2));

    const effectiveRadiusKm = getEffectiveDeliveryRadiusKm(
      business.subscriptionTier,
      business.deliveryRadiusKm,
    );

    // Outside delivery zone: return a clear, structured "no" instead of
    // a fee that keeps growing forever. Not an error — a real answer.
    if (roundedDistance > effectiveRadiusKm) {
      console.warn("DELIVERY_OUTSIDE_RADIUS", {
        businessId,
        distanceKm: roundedDistance,
        effectiveRadiusKm,
      });

      return NextResponse.json({
        success: true,
        distanceKm: roundedDistance,
        deliveryFee: 0,
        isFallback: false,
        outsideDeliveryZone: true,
        deliveryRadiusKm: effectiveRadiusKm,
        message: `This address is outside our ${effectiveRadiusKm}km delivery area.`,
      });
    }

    const deliveryFee =
      Number(business.baseDeliveryFee) +
      roundedDistance * Number(business.deliveryFeePerKm);

    return NextResponse.json({
      success: true,
      distanceKm: roundedDistance,
      deliveryFee: Math.round(deliveryFee),
      isFallback: false,
      outsideDeliveryZone: false,
      latitude: customerCoordinates.latitude,
      longitude: customerCoordinates.longitude,
    });
  } catch (error) {
    console.error("DELIVERY_CALCULATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to calculate delivery fee.",
      },
      { status: 500 },
    );
  }
}
