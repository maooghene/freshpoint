import { HeadphonesIcon, MailIcon, ClockIcon } from "lucide-react";
import { CONTACT_INFO, supportMailto } from "@/lib/contact-config";
import { CUSTOMER_FAQ_GROUPS } from "@/lib/support-faqs";
import FaqAccordion from "@/components/support/FaqAccordion";
import QuestionForm from "@/components/support/QuestionForm";

export default function ContactSupportPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-14 sm:py-16">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <HeadphonesIcon className="size-5" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">How can we help?</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Find a quick answer below. If you can&apos;t, send us your question
          and a real person will reply {CONTACT_INFO.replyTime}.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        {/* FAQs */}
        <section aria-labelledby="faq-heading" className="space-y-4">
          <h2
            id="faq-heading"
            className="text-lg font-extrabold text-foreground"
          >
            Frequently asked questions
          </h2>
          <FaqAccordion groups={CUSTOMER_FAQ_GROUPS} />
        </section>

        {/* Ask + email */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <QuestionForm />

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MailIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </p>
                <a
                  href={supportMailto()}
                  className="block truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {CONTACT_INFO.supportEmail}
                </a>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              We typically reply {CONTACT_INFO.replyTime}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
