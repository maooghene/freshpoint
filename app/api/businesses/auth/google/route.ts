import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Adjust if you use a different Clerk auth import path
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Missing businessId parameter" },
        { status: 400 },
      );
    }

    // Verify the authenticated user actually owns this business profile
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: userId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business profile access denied" },
        { status: 403 },
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/businesses/auth/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Google client credentials missing on server configuration" },
        { status: 500 },
      );
    }

    // Configure the official Google Authorization URL query parameters
    const rootUrl = "https://google.com";
    const options = {
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: "offline", // 🚀 CRITICAL: Forces Google to issue a refreshToken
      prompt: "consent", // 🚀 CRITICAL: Guarantees refresh token generation on re-auth
      response_type: "code",
      scope: ["https://googleapis.com", "https://googleapis.com"].join(" "),
      // Pass the businessId securely inside the state parameter to pick up during callback redirects
      state: businessId,
    };

    const q = new URLSearchParams(options).toString();
    return NextResponse.redirect(`${rootUrl}?${q}`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
