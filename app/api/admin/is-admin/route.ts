import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin"; // FIXED: Uses edge-safe central helper location

// ✅ GET: Instant administrative session authorization verification
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the active Clerk session identity
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // 2. Validate strict administrative authorization privileges
    const isAdmin = await authAdmin(clerkId);

    if (!isAdmin) {
      // Passes a explicit false flag to your frontend layout to route users away
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // 3. Confirm validation status cleanly to client-side routers
    return NextResponse.json({ isAdmin: true }, { status: 200 });
  } catch (error) {
    console.error("CRITICAL_ADMIN_VERIFICATION_ERROR:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
