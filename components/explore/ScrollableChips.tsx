"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal chip row that makes it obvious there is more to scroll to:
 * edge fades and arrow buttons appear on whichever side has hidden content,
 * and on first view the row gives a small "peek" nudge.
 */
export function ScrollableChips({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // One-time peek so people see the row moves. Skipped for reduced motion,
    // when nothing overflows, and when the row was already scrolled.
    let timers: number[] = [];
    try {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const seen = sessionStorage.getItem("explore-chips-peeked") === "1";
      if (
        !reduceMotion &&
        !seen &&
        el.scrollWidth > el.clientWidth + 8 &&
        el.scrollLeft === 0
      ) {
        sessionStorage.setItem("explore-chips-peeked", "1");
        timers = [
          window.setTimeout(
            () => el.scrollTo({ left: 56, behavior: "smooth" }),
            700,
          ),
          window.setTimeout(
            () => el.scrollTo({ left: 0, behavior: "smooth" }),
            1400,
          ),
        ];
      }
    } catch {
      // sessionStorage can be unavailable; the fades and arrows still work.
    }

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [update]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex items-center justify-start gap-2.5 overflow-x-auto pb-3 pt-1 px-1 -mx-1 scrollbar-none scroll-smooth [-webkit-overflow-scrolling:touch]"
      >
        {children}
      </div>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll categories left"
          className="absolute left-0 top-1/2 -translate-y-[60%] flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Scroll categories right"
          className="absolute right-0 top-1/2 -translate-y-[60%] flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted cursor-pointer animate-pulse"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
