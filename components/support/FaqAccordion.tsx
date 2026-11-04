"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import type { FaqGroup, FaqItem } from "@/lib/support-faqs";

interface FaqAccordionProps {
  groups: FaqGroup[];
  /**
   * Base path of the business dashboard (e.g. "/business/my-shop"). When set,
   * FAQ entries that have a shortcut show a button linking inside the dashboard.
   */
  linkBase?: string;
}

function FaqRow({
  item,
  linkBase,
}: {
  item: FaqItem;
  linkBase?: string;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-sm font-semibold text-foreground">
          {item.question}
        </span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          id={panelId}
          className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-muted-foreground animate-in fade-in duration-200"
        >
          <p>{item.answer}</p>
          {linkBase && item.action && (
            <Link
              href={`${linkBase}/${item.action.path}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              {item.action.label}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function FaqAccordion({
  groups,
  linkBase,
}: FaqAccordionProps): React.JSX.Element {
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.question.toLowerCase().includes(needle) ||
            item.answer.toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the questions below"
          aria-label="Search frequently asked questions"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {visibleGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing matches &ldquo;{query.trim()}&rdquo;. Send us your question
          using the form and we&apos;ll get back to you.
        </div>
      ) : (
        visibleGroups.map((group) => (
          <section key={group.title} className="space-y-2.5">
            <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <FaqRow key={item.question} item={item} linkBase={linkBase} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
