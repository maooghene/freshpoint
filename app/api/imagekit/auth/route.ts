import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import imagekit from "@/config/imageKit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authParams = imagekit.getAuthenticationParameters();
  return NextResponse.json(authParams);
}
