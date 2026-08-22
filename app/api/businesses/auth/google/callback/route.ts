import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const businessId = searchParams.get("state"); // The businessId passed out via state parameters earlier

    if (!code || !businessId) {
      return NextResponse.json(
        { error: "Invalid callback validation tokens received" },
        { status: 400 },
      );
    }

    // Exchange code for Access and Refresh tokens
    const tokenUrl = "https://googleapis.com";
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/businesses/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: tokenData.error_description || "Token exchange failed" },
        { status: 400 },
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    if (!refresh_token) {
      return NextResponse.json(
        {
          error:
            "No refresh token returned. Go to your Google account settings, remove this app's permissions, and connect again.",
        },
        { status: 400 },
      );
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Save tokens securely inside your database
    await prisma.googleCredential.upsert({
      where: { businessId },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
      create: {
        businessId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
    });

    // Clean client browser redirect back into the business settings dashboard area
    const businessProfile = await prisma.business.findUnique({
      where: { id: businessId },
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/business/${businessProfile?.slug}/settings?google_sync=success`,
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
