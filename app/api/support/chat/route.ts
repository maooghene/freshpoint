// app/api/support/chat/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { classifyComplaint, createAndNotifyComplaint } from "@/lib/complaints";

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
          text: "The support system configuration key is missing. Please notify the administrator to verify the environment configurations.",
        },
        { status: 200 },
      );
    }

    const { userId: clerkId } = await auth();
    let dynamicUserDataContext =
      "User Status: Guest / Unauthenticated Client.\n";

    if (clerkId) {
      const systemUser = await prisma.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          orders: {
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              code: true,
              status: true,
              totalAmount: true,
              isDelivery: true,
              deliveryAddress: true,
              business: { select: { name: true } },
            },
          },
          bookings: {
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              startTime: true,
              status: true,
              paymentStatus: true,
              totalAmount: true,
              notes: true,
            },
          },
        },
      });

      if (systemUser) {
        dynamicUserDataContext = `
Authenticated User Full Name: ${systemUser.firstName || ""} ${systemUser.lastName || ""}
User Account System ID: ${systemUser.id}
User Recent Orders (Code/Status): ${JSON.stringify(systemUser.orders)}
User Recent Bookings (ID/Time/Status): ${JSON.stringify(systemUser.bookings)}
`;
      }
    }

    const systemPrompt = `You are the primary Customer Experience AI Assistant for FreshPoint—a premium wellness, beauty, and professional services marketplace platform.
    
    TONE RULES:
    - Maintain a polite, clear, and professional corporate tone at all times.
    - Use standard English that is clear and easy to understand.
    - Avoid advanced, overly complex vocabulary or corporate jargon so that any user can interact with ease.
    - Do NOT use street slang, colloquial words, or informal speech variations under any circumstances.
    
    OPERATIONAL DIRECTIONS:
    You have real-time access to the user's active context data appended below. Use this data directly to answer any inquiries regarding their booking times, order tracking statuses, or payment states without asking them for details we already possess. If a specific order code is present, reference it clearly. If a record status is marked as "PENDING", reassure them politely that processing is ongoing.
    
    CURRENT LIVE USER CONTEXT:
    ${dynamicUserDataContext}
    
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
      console.error("Hugging Face Detailed Endpoint Error:", errorResponse);
      throw new Error(`Inference interface returned code: ${response.status}`);
    }

    interface OpenAIChatResponse {
      choices?: { message?: { content?: string } }[];
    }

    const result = (await response.json()) as OpenAIChatResponse;
    let assistantText = result.choices?.[0]?.message?.content?.trim() || "";

    if (!assistantText) {
      assistantText =
        "I apologize, but I am currently unable to process your request. Please try again shortly.";
    }

    if (clerkId) {
      const latestUserMessage =
        [...messages].reverse().find((m) => m.role === "user")?.content || "";

      classifyComplaint(latestUserMessage, dynamicUserDataContext)
        .then(async (classification) => {
          if (!classification.isComplaint) return;

          const systemUser = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true },
          });
          if (!systemUser) return;

          await createAndNotifyComplaint({
            userId: systemUser.id,
            classification,
            rawMessage: latestUserMessage,
          });
        })
        .catch((err) =>
          console.error("Complaint pipeline failed silently:", err),
        );
    }

    return NextResponse.json({ text: assistantText }, { status: 200 });
  } catch (err: unknown) {
    console.error("Support system telemetry runtime exception caught:", err);
    return NextResponse.json(
      {
        text: "We are currently experiencing a slight connection delay with our support systems. Please resend your request in a moment.",
      },
      { status: 200 },
    );
  }
}
