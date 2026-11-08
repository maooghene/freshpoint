import { prisma } from "@/lib/prisma";
import { sendMail, FROM_EMAIL } from "@/lib/mail";
import { escapeHtml } from "@/lib/validation";

/**
 * Tells a store owner when an admin approves or suspends their store.
 * Never throws: a mail problem must not undo the status change.
 */
export async function sendStoreStatusEmail(
  businessId: string,
  status: "approved" | "suspended",
): Promise<void> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        slug: true,
        email: true,
        owner: { select: { firstName: true, email: true } },
      },
    });
    if (!business) return;

    const to = business.owner?.email || business.email;
    if (!to) return;

    const name = escapeHtml(business.owner?.firstName ?? "there");
    const shop = escapeHtml(business.name);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const dashboardUrl = baseUrl
      ? `${baseUrl}/business/${encodeURIComponent(business.slug)}`
      : "";

    if (status === "approved") {
      await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `${business.name} is approved on FreshPoint`,
        html: `
          <p>Hi ${name},</p>
          <p>Good news: <strong>${shop}</strong> has been approved and is now live on FreshPoint. Customers can find and book you.</p>
          ${dashboardUrl ? `<p>Sign in to open your dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>` : "<p>Sign in to FreshPoint to open your dashboard.</p>"}
          <p>Tip: add your services, working hours and photos so customers can book straight away.</p>
          <p>— FreshPoint</p>`,
      });
      return;
    }

    await sendMail({
      from: FROM_EMAIL,
      to,
      subject: `${business.name} has been suspended on FreshPoint`,
      html: `
        <p>Hi ${name},</p>
        <p><strong>${shop}</strong> has been suspended on FreshPoint and is no longer visible to customers.</p>
        <p>If you think this is a mistake, reply to this email and we will look into it.</p>
        <p>— FreshPoint</p>`,
    });
  } catch (error) {
    console.error("STORE_STATUS_EMAIL_FAILURE:", error);
  }
}
