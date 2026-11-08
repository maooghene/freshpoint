import * as React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { HelpCircleIcon, MailIcon, SparklesIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { CONTACT_INFO, supportMailto } from "@/lib/contact-config";
import { BUSINESS_FAQ_GROUPS } from "@/lib/support-faqs";
import FaqAccordion from "@/components/support/FaqAccordion";
import QuestionForm from "@/components/support/QuestionForm";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const TIER_LABEL = {
  STARTER: "Starter",
  GROWTH: "Growth",
  PRO: "Pro",
} as const;

export default async function BusinessSupportPage({ params }: PageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      subscriptionTier: true,
    },
  });

  if (!business) {
    notFound();
  }

  const systemUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  // Same guard as the other dashboard pages: owner, or a verified admin
  // impersonation session for this exact business.
  const authorized = systemUser
    ? await authorizeBusinessAccess({
        businessId: business.id,
        ownerId: business.ownerId,
        systemUserId: systemUser.id,
        allowStaff: false,
      })
    : false;

  if (!authorized) {
    redirect("/select-workspace");
  }

  const linkBase = `/business/${business.slug}`;

  return (
    <main className="container mx-auto min-h-dvh max-w-5xl px-4 py-8 text-foreground transition-colors duration-200">
      <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
        <div className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-muted p-3">
          <HelpCircleIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Help &amp; Support
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Answers and direct help for{" "}
            <span className="rounded-md border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">
              {business.name}
            </span>
            .
          </p>
        </div>
        <Link
          href={`${linkBase}/subscription`}
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted sm:inline-flex"
        >
          <SparklesIcon className="size-3.5 text-primary" />
          {TIER_LABEL[business.subscriptionTier]} plan
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <section aria-labelledby="business-faq-heading" className="space-y-4">
          <h2
            id="business-faq-heading"
            className="text-lg font-extrabold text-foreground"
          >
            Frequently asked questions
          </h2>
          <FaqAccordion groups={BUSINESS_FAQ_GROUPS} linkBase={linkBase} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <QuestionForm
            businessId={business.id}
            businessName={business.name}
          />

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MailIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Prefer email?
                </p>
                <a
                  href={supportMailto(`Support request: ${business.name}`)}
                  className="block truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {CONTACT_INFO.supportEmail}
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
