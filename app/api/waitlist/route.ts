import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Connects to your global prisma client

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Basic validation check
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // 2. Database Action Placeholder
    // Once you create your Waitlist/User model in schema.prisma, uncomment this:
    /*
    const newSignup = await prisma.waitlist.create({
      data: { email: email.toLowerCase() },
    });
    */

    // Logging locally so you can see form submissions in your terminal
    console.log(`🎉 New waitlist submission received: ${email}`);

    return NextResponse.json(
      { success: true, message: "Thank you for joining our waitlist!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
