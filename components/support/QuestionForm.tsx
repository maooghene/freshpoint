"use client";

import { toast } from "@/lib/toast";
import { FormEvent, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MailIcon,
  SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTACT_INFO, supportMailto } from "@/lib/contact-config";

const TOPICS = [
  { value: "BILLING", label: "Billing and payments" },
  { value: "ORDERS", label: "Orders and bookings" },
  { value: "ACCOUNT", label: "Account and business setup" },
  { value: "TECHNICAL", label: "Something isn't working" },
  { value: "OTHER", label: "Something else" },
] as const;

const MAX_MESSAGE = 2000;

interface QuestionFormProps {
  /** Set inside a business dashboard so the team sees which business asked. */
  businessId?: string;
  businessName?: string;
}

export default function QuestionForm({
  businessId,
  businessName,
}: QuestionFormProps): React.JSX.Element {
  const { isLoaded, isSignedIn, user } = useUser();
  const [topic, setTopic] = useState<string>("OTHER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const replyEmail = user?.primaryEmailAddress?.emailAddress;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/support/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject,
          message,
          ...(businessId ? { businessId } : {}),
        }),
      });
      const data: { error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const message =
          response.status === 429
            ? "You've sent a few questions already. Please wait a bit before sending another."
            : data.error || "We couldn't send your question. Please try again.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("Question sent. We'll get back to you soon.");
      setSent(true);
    } catch {
      const message =
        "We couldn't reach the server. Check your connection and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }

  function reset() {
    setSent(false);
    setSubject("");
    setMessage("");
    setTopic("OTHER");
    setError("");
  }

  const shell =
    "rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4";

  if (!isLoaded) {
    return (
      <div className={shell}>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={shell}>
        <div>
          <h2 className="text-base font-extrabold text-foreground">
            Ask us a question
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in so we can link your question to your account and reply to
            the right person.
          </p>
        </div>
        <SignInButton mode="redirect">
          <Button type="button" className="h-10 w-full cursor-pointer rounded-xl font-bold">
            Sign in to ask a question
          </Button>
        </SignInButton>
        <p className="text-center text-xs text-muted-foreground">
          Prefer email?{" "}
          <a
            href={supportMailto()}
            className="font-semibold text-primary hover:underline"
          >
            {CONTACT_INFO.supportEmail}
          </a>
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className={shell} role="status">
        <div className="flex items-start gap-3">
          <CheckCircle2Icon className="mt-0.5 size-6 shrink-0 text-emerald-500" />
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-foreground">
              Question sent
            </h2>
            <p className="text-sm text-muted-foreground">
              We typically reply {CONTACT_INFO.replyTime}
              {replyEmail ? (
                <>
                  {" "}
                  to <span className="font-semibold text-foreground">{replyEmail}</span>
                </>
              ) : null}
              .
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          className="h-10 w-full cursor-pointer rounded-xl text-xs font-bold"
        >
          Ask another question
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={shell}>
      <div>
        <h2 className="text-base font-extrabold text-foreground">
          Ask us a question
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {businessName
            ? `Sending as ${businessName}. `
            : ""}
          Can&apos;t find your answer? Tell us what you need and we&apos;ll reply{" "}
          {CONTACT_INFO.replyTime}.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="support-topic"
          className="text-[10px] font-bold uppercase text-muted-foreground"
        >
          What is it about?
        </label>
        <select
          id="support-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isSending}
          className="h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="support-subject"
          className="text-[10px] font-bold uppercase text-muted-foreground"
        >
          Subject
        </label>
        <Input
          id="support-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. My plan didn't update after payment"
          minLength={3}
          maxLength={120}
          required
          disabled={isSending}
          className="h-11 rounded-xl bg-background"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="support-message"
            className="text-[10px] font-bold uppercase text-muted-foreground"
          >
            Your question
          </label>
          <span className="text-[10px] text-muted-foreground">
            {message.length}/{MAX_MESSAGE}
          </span>
        </div>
        <textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Include any order number, booking reference or payment reference that helps us find it."
          rows={6}
          minLength={10}
          maxLength={MAX_MESSAGE}
          required
          disabled={isSending}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSending}
        className="h-11 w-full cursor-pointer rounded-xl font-bold shadow-sm"
      >
        {isSending ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <SendIcon className="mr-2 size-4" />
            Send question
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <MailIcon className="size-3.5" />
        Or email{" "}
        <a
          href={supportMailto()}
          className="font-semibold text-primary hover:underline"
        >
          {CONTACT_INFO.supportEmail}
        </a>
      </p>
    </form>
  );
}
