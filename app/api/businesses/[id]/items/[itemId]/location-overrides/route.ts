// app/api/businesses/[id]/items/[itemId]/location-overrides/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";
import { verifyItemTenantOwnership } from "../../helpers";

interface RouteContext {
  params: Promise<{ id: string; itemId: string }>;
}

async function resolveBusinessId(slugOrId: string): Promise<string | null> {
  const business = await prisma.business.findFirst({
    where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
    select: { id: true },
  });
  return business?.id ?? null;
}

// GET: merged view of every location this business has, with whatever
// override (if any) currently exists for this specific item. Absence of an
// override row for a location means "use the base item price, fully
// available" — this endpoint fills that in explicitly so the UI never has
// to guess.
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: routeSlugOrId, itemId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetBusinessId = await resolveBusinessId(routeSlugOrId);
    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== targetBusinessId) {
      return NextResponse.json(
        { error: "Unauthorized tenant bounds matching" },
        { status: 401 },
      );
    }

    const item = await verifyItemTenantOwnership(itemId, businessId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const [locations, overrides] = await Promise.all([
      prisma.location.findMany({
        where: { businessId },
        select: { id: true, name: true, isPrimary: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      }),
      prisma.locationItemOverride.findMany({
        where: { itemId },
        select: { locationId: true, price: true, isAvailable: true },
      }),
    ]);

    const overrideByLocation = new Map(overrides.map((o) => [o.locationId, o]));

    const merged = locations.map((loc) => {
      const override = overrideByLocation.get(loc.id);
      return {
        locationId: loc.id,
        locationName: loc.name,
        isPrimary: loc.isPrimary,
        price: override?.price ?? null,
        isAvailable: override?.isAvailable ?? true,
      };
    });

    return NextResponse.json({ overrides: merged }, { status: 200 });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

interface OverrideInput {
  locationId: string;
  price: number | null;
  isAvailable: boolean;
}

// PUT: wipe-and-recreate, same sync strategy already used for ItemVariant in
// items/route.ts. Only writes a row when it actually deviates from the
// default (a custom price, or marked unavailable) — a location left at
// "no override, available" gets no row at all, matching the schema's
// documented "absence of a row = use base" convention.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: routeSlugOrId, itemId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetBusinessId = await resolveBusinessId(routeSlugOrId);
    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const businessId = await authOwner(clerkId);
    if (!businessId || businessId !== targetBusinessId) {
      return NextResponse.json(
        { error: "Unauthorized tenant bounds matching" },
        { status: 401 },
      );
    }

    const item = await verifyItemTenantOwnership(itemId, businessId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      overrides?: OverrideInput[];
    } | null;

    if (!body || !Array.isArray(body.overrides)) {
      return NextResponse.json(
        { error: "Missing or invalid overrides payload" },
        { status: 400 },
      );
    }

    // Defense against cross-tenant writes: every locationId in the payload
    // must actually belong to this business, verified server-side, not
    // trusted from the client.
    const validLocationIds = new Set(
      (
        await prisma.location.findMany({
          where: { businessId },
          select: { id: true },
        })
      ).map((l) => l.id),
    );

    const rowsToCreate = body.overrides
      .filter((o) => validLocationIds.has(o.locationId))
      .filter((o) => o.price !== null || o.isAvailable === false)
      .map((o) => ({
        itemId,
        locationId: o.locationId,
        price: o.price,
        isAvailable: o.isAvailable,
      }));

    await prisma.$transaction(async (tx) => {
      await tx.locationItemOverride.deleteMany({ where: { itemId } });
      if (rowsToCreate.length > 0) {
        await tx.locationItemOverride.createMany({ data: rowsToCreate });
      }
    });

    return NextResponse.json(
      { message: "Location pricing updated" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Database Execution Drop";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
