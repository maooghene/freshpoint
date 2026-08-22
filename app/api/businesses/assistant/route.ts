import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import authOwner from "@/lib/authOwner";

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: IncomingMessage[] };
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          text: "The assistant configuration key is missing. Please notify the administrator.",
        },
        { status: 200 },
      );
    }

    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { text: "Please sign in to use the business assistant." },
        { status: 200 },
      );
    }

    const systemUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!systemUser) {
      return NextResponse.json({ text: "Account not found." }, { status: 200 });
    }

    // ✅ FIXED: Use the shared authOwner helper instead of a hand-rolled
    // ownerId lookup, so this route resolves ownership the same way every
    // other business route does.
    const businessId = await authOwner(clerkId);

    if (!businessId) {
      return NextResponse.json(
        {
          text: "This assistant is only available to business owners with a registered business.",
        },
        { status: 200 },
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true },
    });

    if (!business) {
      return NextResponse.json(
        {
          text: "This assistant is only available to business owners with a registered business.",
        },
        { status: 200 },
      );
    }

    // ✅ FIXED: dynamicBusinessContext now actually reflects the resolved
    // business instead of being permanently stuck on the "not found" string.
    const dynamicBusinessContext = `Business Name: ${business.name}\nBusiness Slug: ${business.slug}\n`;

    const systemPrompt = `You are the Business Operations Assistant for a business owner on FreshPoint, a wellness and services marketplace.

TONE RULES:
- Professional, direct, and efficient — this is a business owner managing their operations, not a customer.
- No sales language, no over-apologizing. Get to the point.

OPERATIONAL DIRECTIONS:
Use the business context below to answer questions about their orders, bookings, and any open customer complaints assigned to them. If asked about a complaint, summarize it clearly and suggest they mark it resolved once addressed (via the dashboard). Do not make promises on the business's behalf about refunds or compensation — flag that as an admin/business decision if asked.

CURRENT BUSINESS CONTEXT:
${dynamicBusinessContext}

Current Date/Time: Monday, July 13, 2026 (Timezone: WAT UTC+1).`;

    const compiledMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    ];

    const HF_MODEL = process.env.HF_MODEL || "deepseek-ai/DeepSeek-V3:fastest";

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: HF_MODEL,
          messages: compiledMessages,
          max_tokens: 300,
          temperature: 0.2,
        }),
      },
    );

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Business assistant HF error:", errorResponse);
      throw new Error(`Inference interface returned code: ${response.status}`);
    }

    interface OpenAIChatResponse {
      choices?: { message?: { content?: string } }[];
    }

    const result = (await response.json()) as OpenAIChatResponse;
    let assistantText = result.choices?.[0]?.message?.content?.trim() || "";

    if (!assistantText) {
      assistantText =
        "I'm currently unable to process that request. Please try again shortly.";
    }

    return NextResponse.json({ text: assistantText }, { status: 200 });
  } catch (err: unknown) {
    console.error("Business assistant runtime exception:", err);
    return NextResponse.json(
      {
        text: "We're experiencing a brief connection delay. Please try again in a moment.",
      },
      { status: 200 },
    );
  }
}
