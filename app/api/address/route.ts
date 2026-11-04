// app/api/address/route.ts
export const dynamic = "force-dynamic";

import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { parseJsonBody, text, optionalText } from "@/lib/validation";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ POST: Create a new address for the logged-in user
export async function POST(request: NextRequest) {
  {
    const limited = await rateLimit(request, RATE_LIMITS.mutation);
    if (limited) return limited;
  }
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Parse incoming address field values from client payload
    const parsed = await parseJsonBody(
      request,
      z.object({
        street: text(200),
        city: text(100),
        state: optionalText(100),
        zipCode: z.coerce.string().trim().min(1).max(20),
        isDefault: z.boolean().optional(),
      }),
    );
    if (!parsed.ok) return parsed.response;
    const { street, city, state, zipCode, isDefault } = parsed.data;

    if (!street || !city || !zipCode) {
      return NextResponse.json(
        { error: "Missing required address fields" },
        { status: 400 },
      );
    }

    // 2. Resolve internal sequential database User.id row from Clerk identity hook
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not registered" },
        { status: 404 },
      );
    }

    // 3. If this is designated as the new default, clear previous default states safely
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    // 4. Save new address node directly to database matching relational constraints
    const newAddress = await prisma.address.create({
      data: {
        street,
        city,
        state: state || null,
        zipCode,
        isDefault: isDefault || false,
        userId: user.id,
      },
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error("Error creating user address entry:", error);
    return NextResponse.json(
      { error: "Failed to create address node" },
      { status: 500 },
    );
  }
}

// ✅ GET: Fetch all saved addresses belonging to the active user session
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: {
        // FIXED: Sorts your default address to the very top first, then falls back to sequential ID order
        isDefault: "desc",
      },
    });

    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    console.error("Error fetching user addresses logs:", error);
    return NextResponse.json(
      { error: "Failed to retrieve address indexes" },
      { status: 500 },
    );
  }
}
