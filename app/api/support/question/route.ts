// app/api/support/question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { parseJsonBody, idSchema, text } from "@/lib/validation";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { createAndNotifyComplaint } from "@/lib/complaints";

const TOPICS = ["BILLING", "ORDERS", "ACCOUNT", "TECHNICAL", "OTHER"] as const;
type Topic = (typeof TOPICS)[number];

const TOPIC_LABEL: Record<Topic, string> = {
  BILLING: "Billing and payments",
  ORDERS: "Orders and bookings",
  ACCOUNT: "Account and business setup",
  TECHNICAL: "Something isn't working",
  OTHER: "Something else",
};

const questionSchema = z.object({
  topic: z.enum(TOPICS),
  subject: text(120, 3),
  message: text(2000, 10),
  // Set when the question is asked from inside a business dashboard.
  businessId: idSchema.optional(),
});

// Questions are saved as support tickets so they show up in the admin
// Support & Grievance Console next to complaints, and admins are emailed.
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.supportQuestion);
  if (limited) return limited;

  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Please sign in to send us a question." },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "We couldn't find your account. Please sign in again." },
        { status: 404 },
      );
    }

    const parsed = await parseJsonBody(req, questionSchema);
    if (!parsed.ok) return parsed.response;
    const { topic, subject, message, businessId } = parsed.data;

    // Only attach a business the caller actually has access to; the id comes
    // from the client and must never be trusted on its own.
    let verifiedBusinessId: string | undefined;
    if (businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, ownerId: true },
      });
      const allowed = business
        ? await authorizeBusinessAccess({
            businessId: business.id,
            ownerId: business.ownerId,
            systemUserId: dbUser.id,
            allowStaff: false,
          })
        : false;
      if (!business || !allowed) {
        return NextResponse.json(
          { error: "You don't have access to that business." },
          { status: 403 },
        );
      }
      verifiedBusinessId = business.id;
    }

    const category =
      topic === "BILLING"
        ? "PAYMENT"
        : topic === "TECHNICAL"
          ? "APP_BUG"
          : "OTHER";
    const severity = topic === "BILLING" || topic === "TECHNICAL" ? "MEDIUM" : "LOW";

    const complaint = await createAndNotifyComplaint({
      userId: dbUser.id,
      classification: {
        isComplaint: true,
        category,
        severity,
        relatedBusinessId: verifiedBusinessId,
        summary: `Question: ${subject}`,
      },
      rawMessage: `[${TOPIC_LABEL[topic]}]\n${message}`,
    });

    return NextResponse.json(
      { message: "Question sent", id: complaint.id },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("SUPPORT_QUESTION_POST_FAILURE:", error);
    return NextResponse.json(
      { error: "We couldn't send your question. Please try again." },
      { status: 500 },
    );
  }
}
