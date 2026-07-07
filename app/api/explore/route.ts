import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("search")?.trim() || "";

    // Define the dynamic query query constraints configuration mapping array
    const searchFilter = query
      ? {
          status: "approved", // Strict multi-tenant rule: hide unverified/pending operators
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive" as const, // Enables case-insensitive checks (e.g., 'spa' matches 'Spa')
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {
          status: "approved", // If empty query string parameter, return all active merchants
        };

    console.log(`🔍 [FreshPoint Search] Querying marketplace catalog using query: "${query}"`);

    // Fetch the matched businesses from Neon Serverless Postgres
    const merchants = await prisma.business.findMany({
      where: searchFilter,
      select: {
        id: true,
        name: true,
        slug: true,
        profileImage: true,
        address: true,
        phone: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, merchants }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("🚨 [FreshPoint Explore Search Error]:", msg);
    return NextResponse.json(
      { error: "Internal operational discovery network error processing your search catalog" },
      { status: 500 }
    );
  }
}
