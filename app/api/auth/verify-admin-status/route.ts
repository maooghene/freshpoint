// app/api/auth/verify-admin-status/route.ts
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin";

export const revalidate = 0; // Absolute dynamic configuration prevents caching runtime data

/**
 * Endpoint for client-side navigation UI elements to verify administrative roles securely.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await verifyAdminSession();

    return NextResponse.json(
      {
        isAdmin: session.isAdmin,
        isPlatformStaff: session.isPlatformStaff,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { isAdmin: false, isPlatformStaff: false },
      { status: 200 },
    );
  }
}
