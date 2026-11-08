import * as React from "react";
import Link from "next/link";

export interface LegalSection {
  heading: string;
  /** Paragraphs shown in order. */
  body?: string[];
  /** Optional bullet list shown after the paragraphs. */
  bullets?: string[];
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

// Shared layout for the Terms and Privacy pages: readable width, numbered
// sections, and a link to the other document.
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Last updated {updated}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {intro}
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((section, index) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              {index + 1}. {section.heading}
            </h2>
            {section.body?.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm font-semibold">
        <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
          Privacy Policy
        </Link>
        <Link href="/" className="text-muted-foreground underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
