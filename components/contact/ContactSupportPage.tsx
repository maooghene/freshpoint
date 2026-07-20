"use client";

import { useState } from "react";
import { MailIcon, HeadphonesIcon, ChevronDownIcon } from "lucide-react";
import { CONTACT_INFO } from "@/lib/contact-config";

interface ContactChannel {
  label: string;
  value: string | null;
  href: string | null;
  icon: React.ReactNode;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I cancel or reschedule a booking?",
    answer:
      "Go to Bookings in your account, open the booking, and choose Cancel or Reschedule. Changes made more than 24 hours before your appointment are usually free.",
  },
  {
    question: "Where do I track my order?",
    answer:
      "Visit Orders under your account menu to see live status, from confirmed through delivered.",
  },
  {
    question: "How do I register my business on FreshPoint?",
    answer:
      "Head to the Register Business page and fill in your business details. Approval usually takes 1-2 business days.",
  },
  {
    question: "I was charged but didn't receive a confirmation. What now?",
    answer:
      "Email us with your payment reference and the email or phone number used at checkout, and we'll look into it right away.",
  },
];

function FaqAccordionItem({ item }: { item: FaqItem }): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-primary/10 rounded-xl bg-background/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-foreground">
          {item.question}
        </span>
        <ChevronDownIcon
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-muted-foreground animate-in fade-in duration-200">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function ContactSupportPage(): React.JSX.Element {
  const mailSubject = encodeURIComponent("FreshPoint Support Request");
  const channels: ContactChannel[] = [
    {
      label: "Email",
      value: CONTACT_INFO.supportEmail,
      href: `mailto:${CONTACT_INFO.supportEmail}?subject=${mailSubject}`,
      icon: <MailIcon className="size-5" />,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <HeadphonesIcon className="size-5" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Contact support</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Check the quick answers below first — if you still need us, email goes
          straight to a real person and we typically reply within a day.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          Quick answers
        </p>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem key={item.question} item={item} />
          ))}
        </div>
      </div>

      {/* Contact channels */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          Still need help?
        </p>
        <div className="grid gap-4 bg-background/40 backdrop-blur-md border border-primary/10 p-8 rounded-[2rem] shadow-xl">
          {channels.map((channel) => (
            <div
              key={channel.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-primary/10 bg-background/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-primary shrink-0">{channel.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {channel.label}
                  </p>
                  <p className="text-sm text-foreground truncate">
                    {channel.value ?? "Coming soon"}
                  </p>
                </div>
              </div>

              {channel.href && (
                <a
                  href={channel.href}
                  className="text-sm font-semibold text-primary hover:underline shrink-0 self-start sm:self-center pl-8 sm:pl-0"
                >
                  Reach out
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
