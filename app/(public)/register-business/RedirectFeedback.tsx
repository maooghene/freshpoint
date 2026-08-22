// app/register-business/RedirectFeedback.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

interface RedirectFeedbackProps {
  slug: string;
}

export function RedirectFeedback({ slug }: RedirectFeedbackProps) {
  const router = useRouter();

  React.useEffect(() => {
    // Fire the replacement router shift straight onto your /business/[slug] parameter layout tree
    if (slug) {
      router.replace(`/business/${slug}`);
    }
  }, [slug, router]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="rounded-2xl border border-border bg-card p-8 max-w-sm shadow-xl flex flex-col items-center">
        <div className="rounded-xl bg-primary/10 p-3 text-primary mb-4 animate-bounce">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-black text-foreground">
          Workspace Detected
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          You already have an active store registered under this account
          profile. Redirecting to your console...
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Synchronizing credentials
        </div>
      </div>
    </main>
  );
}
