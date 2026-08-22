import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";
import {
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintAssignee,
} from "@prisma/client";

interface ComplaintClassification {
  isComplaint: boolean;
  category?: ComplaintCategory;
  severity?: ComplaintSeverity;
  relatedBusinessId?: string;
  relatedOrderCode?: string;
  relatedBookingId?: string;
  summary?: string;
}

const HF_MODEL = process.env.HF_MODEL || "deepseek-ai/DeepSeek-V3:fastest";

export async function classifyComplaint(
  latestUserMessage: string,
  userContext: string,
): Promise<ComplaintClassification> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return { isComplaint: false };

  const classifierPrompt = `You are a classifier for a customer support system. Given the user's context and their latest message, decide if it is a COMPLAINT (not just a question or casual chat).

A complaint includes: payment delays, refund issues, service delays/no-shows, quality issues, app bugs, or complaints about a business owner's conduct.

Respond with ONLY valid JSON, no markdown, no explanation, matching this exact shape:
{
  "isComplaint": boolean,
  "category": "PAYMENT" | "SERVICE_DELAY" | "APP_BUG" | "BUSINESS_CONDUCT" | "OTHER" | null,
  "severity": "LOW" | "MEDIUM" | "HIGH" | null,
  "relatedBusinessId": string | null,
  "relatedOrderCode": string | null,
  "relatedBookingId": string | null,
  "summary": string | null
}

USER CONTEXT:
${userContext}

LATEST USER MESSAGE:
${latestUserMessage}`;

  try {
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
          messages: [{ role: "user", content: classifierPrompt }],
          max_tokens: 300,
          temperature: 0,
        }),
      },
    );

    if (!response.ok) {
      console.error("Complaint classifier HF error:", await response.text());
      return { isComplaint: false };
    }

    const result = await response.json();
    const raw = result?.choices?.[0]?.message?.content?.trim() || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();

    return JSON.parse(clean) as ComplaintClassification;
  } catch (err) {
    console.error("Complaint classification failed:", err);
    return { isComplaint: false };
  }
}

function resolveAssignee(category: ComplaintCategory): ComplaintAssignee {
  switch (category) {
    case "SERVICE_DELAY":
      return ComplaintAssignee.BUSINESS_OWNER;
    case "PAYMENT":
    case "APP_BUG":
    case "BUSINESS_CONDUCT":
    case "OTHER":
    default:
      return ComplaintAssignee.ADMIN;
  }
}

export async function createAndNotifyComplaint(params: {
  userId: string;
  classification: ComplaintClassification;
  rawMessage: string;
}) {
  const { userId, classification, rawMessage } = params;
  const category = classification.category || "OTHER";
  const severity = classification.severity || "MEDIUM";
  const assignedTo = resolveAssignee(category as ComplaintCategory);

  const complaint = await prisma.complaint.create({
    data: {
      userId,
      businessId: classification.relatedBusinessId || undefined,
      orderCode: classification.relatedOrderCode || undefined,
      bookingId: classification.relatedBookingId || undefined,
      category: category as ComplaintCategory,
      severity: severity as ComplaintSeverity,
      assignedTo,
      summary:
        classification.summary || "Customer complaint (no summary generated).",
      rawMessage,
    },
  });

  await notifyComplaint(complaint.id, assignedTo, complaint.businessId);

  return complaint;
}

async function notifyComplaint(
  complaintId: string,
  assignedTo: ComplaintAssignee,
  businessId: string | null,
) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { user: true, business: true },
  });
  if (!complaint) return;

  const recipients: string[] = [];

  if (assignedTo === "ADMIN" || complaint.severity === "HIGH") {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    recipients.push(...admins.map((a) => a.email).filter(Boolean));
  }

  if (assignedTo === "BUSINESS_OWNER" && businessId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { email: true } } },
    });
    if (business?.owner?.email) recipients.push(business.owner.email);
  }

  const uniqueRecipients = [...new Set(recipients)];
  if (uniqueRecipients.length === 0) {
    console.warn(`No recipients resolved for complaint ${complaintId}`);
    return;
  }

  const subjectPrefix =
    complaint.severity === "HIGH" ? "🔴 URGENT" : "⚠️ New Complaint";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: uniqueRecipients,
      subject: `${subjectPrefix} — ${complaint.category.replace("_", " ")} (${complaint.user.firstName || "Customer"})`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2>${complaint.category.replace("_", " ")} Complaint</h2>
          <p><strong>Severity:</strong> ${complaint.severity}</p>
          <p><strong>Customer:</strong> ${complaint.user.firstName || ""} ${complaint.user.lastName || ""} (${complaint.user.email})</p>
          ${complaint.orderCode ? `<p><strong>Order:</strong> ${complaint.orderCode}</p>` : ""}
          ${complaint.bookingId ? `<p><strong>Booking ID:</strong> ${complaint.bookingId}</p>` : ""}
          <p><strong>Summary:</strong> ${complaint.summary}</p>
          <hr />
          <p style="color:#666; font-size: 13px;"><strong>Original message:</strong><br/>${complaint.rawMessage}</p>
          <p style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/complaints/${complaint.id}"
               style="background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
              View in dashboard
            </a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send complaint email via Resend:", err);
  }
}
