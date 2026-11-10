// app/api/support/chat/route.ts
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation";
import { NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";
import { classifyComplaint, createAndNotifyComplaint } from "@/lib/complaints";

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const maxDuration = 60;

export async function POST(req: Request) {
  {
    const limited = await rateLimit(req, RATE_LIMITS.aiChat);
    if (limited) return limited;
  }
  {
    const limited = await rateLimit(req, RATE_LIMITS.aiChatIp, { byIp: true });
    if (limited) return limited;
  }
  try {
    const chatParse = await parseJsonBody(
      req,
      z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string().max(4000),
            }),
          )
          .min(1)
          .max(30)
          // The server supplies its own system prompt. A client-supplied
          // "system" message is a prompt-injection attempt, so drop it.
          .transform((all) => all.filter((m) => m.role !== "system")),
      }),
    );
    if (!chatParse.ok) return chatParse.response;
    const messages: IncomingMessage[] = chatParse.data.messages;
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
    
    Current Date/Time: ${new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    })} (Timezone: WAT UTC+1).`;

    const compiledMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    ];

    const HF_MODEL = process.env.HF_MODEL || "deepseek-ai/DeepSeek-V3:fastest";

    // One attempt, plus one retry for a network error, timeout or a
    // temporary provider problem (429/5xx). Each attempt gives up after 25s so
    // the customer is never left waiting on a hung connection.
    const callModel = () =>
      fetch("https://router.huggingface.co/v1/chat/completions", {
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
        signal: AbortSignal.timeout(25_000),
      });

    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await callModel();
        if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) {
          break;
        }
      } catch (networkError) {
        console.error("[support-chat] model request failed:", networkError);
        response = null;
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 0;
      const detail = response ? (await response.text()).slice(0, 500) : "no response";
      console.error(
        `[support-chat] Hugging Face failed (model ${HF_MODEL}, status ${status}):`,
        detail,
      );
      Sentry.captureMessage(`Support chat model failed (status ${status})`, {
        level: "error",
        tags: { area: "support-chat", status: String(status) },
        extra: { model: HF_MODEL, detail },
      });

      // 401/402/403 mean the provider account itself is the problem (bad key,
      // no credits, no access). A retry will not help, so say so honestly.
      const providerProblem = [401, 402, 403].includes(status);
      return NextResponse.json(
        {
          text: providerProblem
            ? "Our AI assistant is temporarily unavailable. Please send us a message on the Contact page and our team will reply by email."
            : "We are currently experiencing a slight connection delay with our support systems. Please resend your request in a moment.",
        },
        { status: 200 },
      );
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

      // Serverless functions are frozen once the response is sent, so a bare
      // fire-and-forget promise can be dropped before the complaint is saved.
      // after() keeps the work alive without making the customer wait.
      after(async () => {
        try {
          const classification = await classifyComplaint(
            latestUserMessage,
            dynamicUserDataContext,
          );
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
        } catch (err) {
          console.error("Complaint pipeline failed:", err);
        }
      });
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
