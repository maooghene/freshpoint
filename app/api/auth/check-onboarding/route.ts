import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    // 1. If not authenticated, prompt back to standard creation entry point fallback
    if (!userId) {
      return NextResponse.json({ destination: "/register-business" });
    }

    // 2. Fetch the corresponding internal database system user id index
    const systemUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!systemUser) {
      // Fallback destination if the database user row hasn't synced yet
      return NextResponse.json({ destination: "/register-business" });
    }

    // 3. Find the first business owned explicitly by this caller to grab its slug token
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: systemUser.id },
      select: { slug: true },
    });

    // 4. THE CORRECT CORRECTION: Dynamically point returning merchants to /business/[slug] instead of /dashboard
    const destination = existingBusiness
      ? `/business/${existingBusiness.slug}`
      : "/register-business";

    return NextResponse.json({ destination });
  } catch {
    return NextResponse.json(
      { destination: "/register-business" },
      { status: 500 },
    );
  }
}
