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

  const [timeGreeting] = React.useState<string>(() => {
    if (typeof window === "undefined") return "Hello";
    return getGreetingFragment(new Date().getHours());
  });

  const displayName = React.useMemo<string>(() => {
    if (!user) return "";
    let rawName = user.firstName || user.fullName || "";
    if (!rawName) {
      const fallbackEmail = user.primaryEmailAddress?.emailAddress;
      if (fallbackEmail) rawName = fallbackEmail.split("@")[0] || "";
    }
    const cleaned = rawName
      .replace(/\s?\d{4}$/, "")
      .replace(/\d+$/, "")
      .trim();
    return cleaned.split(" ")[0] || "Valued Guest";
  }, [user]);

  return (
    <section className="relative overflow-hidden py-10 sm:py-14 lg:py-0 lg:min-h-[86vh] lg:flex lg:items-center border-b border-border/40">
      {/* Soft ambient backdrop for the whole section */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-emerald-50/10 to-primary/5" />

      <div className="w-full px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* ── TEXT ZONE — solid ground, never on top of the photo ── */}
            <div className="order-2 lg:order-1 lg:col-span-5 text-center lg:text-left">
              <div className="max-w-md mx-auto lg:mx-0 space-y-5">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 select-none
                             animate-in fade-in slide-in-from-bottom-2 duration-700"
                  style={{ animationFillMode: "backwards" }}
                >
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                    The All-In-One Merchant Ecosystem
                  </span>
                </div>

                {user ? (
                  <h1
                    className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white
                               animate-in fade-in slide-in-from-bottom-3 duration-700"
                    style={{
                      animationDelay: "120ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    {timeGreeting},{" "}
                    <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                      {displayName}
                    </span>
                  </h1>
                ) : (
                  <h1
                    className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white
                               animate-in fade-in slide-in-from-bottom-3 duration-700"
                    style={{
                      animationDelay: "120ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    Find premium{" "}
                    <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                      products & services
                    </span>{" "}
                    instantly
                  </h1>
                )}

                <p
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium
                             animate-in fade-in slide-in-from-bottom-3 duration-700"
                  style={{
                    animationDelay: "240ms",
                    animationFillMode: "backwards",
                  }}
                >
                  {user
                    ? "Ready to explore the marketplace? Discover premium fashion brands, local shops, and secure professional appointments near you."
                    : "Discover exceptional local brands, buy premium fashion items, and secure expert appointments in seconds."}
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1
                             animate-in fade-in slide-in-from-bottom-3 duration-700"
                  style={{
                    animationDelay: "360ms",
                    animationFillMode: "backwards",
                  }}
                >
                  <Link
                    href="/explore"
                    className="w-full sm:w-auto select-none"
                  >
                    <Button
                      size="lg"
                      className="w-full sm:w-auto rounded-xl font-bold text-sm h-11 gap-2 cursor-pointer shadow-sm hover:opacity-90 hover:scale-[1.02] transition-all"
                    >
                      <Search className="w-4 h-4 shrink-0" />
                      {user ? "Explore Marketplace" : "Shop & Book Now"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── IMAGE ZONE — contained card, own aspect ratio, never blocks text ── */}
            <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
              <div className="max-w-md sm:max-w-lg lg:max-w-none mx-auto">
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
