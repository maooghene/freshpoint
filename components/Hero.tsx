"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { getGreetingFragment } from "@/lib/greetings";
import HeroSlideshow from "./HeroSlideshow";

function Hero(): React.JSX.Element {
  const { user } = useUser();

  // 🛡️ REACT 19 LAZY INITIALIZER: Evaluates browser clock on mount without using useEffect
  const [timeGreeting] = React.useState<string>(() => {
    if (typeof window === "undefined") return "Hello";
    const browserHour: number = new Date().getHours();
    return getGreetingFragment(browserHour);
  });

  // Robust fallback and token string sanitization sequence for Google/Gmail OAuth logins
  const displayName = React.useMemo<string>(() => {
    if (!user) return "";

    let rawName: string = user.firstName || user.fullName || "";

    if (!rawName) {
      const fallbackEmail: string | undefined =
        user.primaryEmailAddress?.emailAddress;
      if (fallbackEmail) {
        const parts: string[] = fallbackEmail.split("@");
        rawName = parts[0] || "";
      }
    }

    const cleanedName: string = rawName
      .replace(/\s?\d{4}$/, "")
      .replace(/\d+$/, "")
      .trim();

    const nameSegments: string[] = cleanedName.split(" ");
    return nameSegments[0] || "Valued Guest";
  }, [user]);

  return (
    <section className="relative h-auto min-h-[70vh] flex items-center overflow-hidden py-8 md:py-12 border-b border-border/40 bg-background block">
      {/* ── CLEAN ORGANIC BACKDROP ── */}
      <div className="absolute inset-0 bg-gradient-to-tr from-background via-emerald-50/10 to-primary/5 -z-10" />

      {/* SOFT NATURAL GLOW MESH ORBS */}
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-12 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] -z-10" />

      <div className="relative z-10 w-full px-4 sm:px-6">
        <div className="max-w-7xl mx-auto min-w-0 w-full block">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-w-0 w-full">
            {/* ── LEFT CONTENT COLUMN ── */}
            <div className="space-y-4 text-center lg:text-left min-w-0 flex flex-col items-center lg:items-start">
              <div className="space-y-3 w-full">
                {/* Compact Branding Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 select-none mx-auto lg:mx-0">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                    {"The All-In-One Merchant Ecosystem"}
                  </span>
                </div>

                {/* Main Heading Content Text Blocks */}
                {user ? (
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white block">
                    <span className="text-slate-900 dark:text-white">
                      {timeGreeting}
                      {", "}
                    </span>
                    {/* ISOLATED SOLID COLOR SPAN */}
                    <span className="text-primary font-black tracking-tight capitalize inline-block clear-both">
                      {displayName}
                    </span>
                  </h1>
                ) : (
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white block">
                    <span className="text-slate-900 dark:text-white">
                      {"Find premium "}
                    </span>
                    <span className="inline">
                      <span className="text-primary">
                        {"products & services "}
                      </span>
                      <span className="text-slate-900 dark:text-white">
                        {"instantly"}
                      </span>
                    </span>
                  </h1>
                )}

                {/* Subtitle Description Paragraphs */}
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  {user
                    ? "Ready to explore the marketplace? Discover premium fashion brands, local shops, and secure professional appointments near you."
                    : "Discover exceptional local brands, buy premium fashion items, and secure expert appointments in seconds. Track orders and service schedules under a single profile tailored for clients and business owners."}
                </p>
              </div>

              {/* Call to Actions CTA Action Triggers - Cleaned up to show only the primary shop path */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2 w-full sm:w-auto">
                <Link href="/explore" className="w-full sm:w-auto select-none">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-xl font-bold text-sm h-11 gap-2 cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <Search className="w-4 h-4 shrink-0" />
                    {user ? "Explore Marketplace" : "Shop & Book Now"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── RIGHT SLIDESHOW DISPLAY COLUMN ── */}
            <div className="relative flex justify-center lg:justify-end w-full max-w-[480px] mx-auto lg:max-w-none flex-shrink-0">
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-primary/10 rounded-2xl rotate-45 blur-xl -z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl blur-xl scale-105 -z-10" />

              <div className="w-full relative shadow-2xl rounded-2xl overflow-hidden border border-border/40 bg-card">
                <HeroSlideshow />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
