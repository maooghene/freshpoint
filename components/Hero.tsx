"use client";

import * as React from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link"; // 🌟 FIXED: Imported standard Next.js Link component cleanly
import { Button } from "./ui/button";
import { Search, Sparkles } from "lucide-react";
import { getTimeBasedGreeting } from "@/lib/greetings";
import HeroSlideshow from "./HeroSlideshow";

function Hero() {
  const { user } = useUser();

  // Robust fallback and sanitization sequence for Google/Gmail OAuth logins
  const displayName = React.useMemo(() => {
    if (!user) return "";

    let rawName = user.firstName || user.fullName || "";

    if (!rawName) {
      const fallbackEmail = user.primaryEmailAddress?.emailAddress;
      if (fallbackEmail) {
        const parts = fallbackEmail.split("@");
        rawName = parts[0] || "";
      }
    }

    const cleanedName = rawName
      .replace(/\s?\d{4}$/, "")
      .replace(/\d+$/, "")
      .trim();

    const nameSegments = cleanedName.split(" ");
    return nameSegments[0] || "Valued Guest";
  }, [user]);

  return (
    <section className="relative h-auto min-h-[70vh] flex items-center overflow-hidden py-8 md:py-12 border-b border-border/40">
      {/* GRID VECTOR ACCENT LAYER */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-primary/5 -z-10">
        <div
          className="absolute inset-0 
          bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] 
          dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] 
          bg-[size:4rem_4rem] 
          [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        />
      </div>

      {/* GRADIENT BACKDROP GLOW ORBS */}
      <div className="absolute top-12 left-1/4 w-60 h-60 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-3xl -z-10" />

      <div className="relative z-10 w-full px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* ── LEFT CONTENT COLUMN ── */}
            <div className="space-y-4 text-center lg:text-left">
              <div className="space-y-3">
                {/* Compact Info Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full border border-primary/20 backdrop-blur-sm mx-auto lg:mx-0">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {"Smart Booking for Wellness Spaces"}
                  </span>
                </div>

                {/* Main Heading Text Fields */}
                {user ? (
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                      {getTimeBasedGreeting()}
                      {", "}
                    </span>
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent capitalize">
                      {displayName}
                    </span>
                  </h1>
                ) : (
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                    <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                      {"Find top-tier "}
                    </span>
                    <span className="inline">
                      <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {"wellness spaces "}
                      </span>
                      <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                        {"and book instantly"}
                      </span>
                    </span>
                  </h1>
                )}

                {/* Subtitle Description */}
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  {user
                    ? "Ready to prioritize your self-care today? Explore premier salons, spas, and wellness spaces near you."
                    : "Discover exceptional wellness providers, secure open slots in seconds, and track your self-care routine with ease. Built for clients and business owners."}
                </p>
              </div>

              {/* Call to Actions CTA Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                {user ? (
                  // 🌟 FIXED: Swapped out raw HTML <a> layout link parameters for optimized <Link> compilation node anchors
                  <Link href="/explore" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto rounded-xl font-bold text-sm h-11 gap-2 cursor-pointer shadow-sm hover:scale-[1.01] transition-all"
                    >
                      <Search className="w-4 h-4" />
                      {"Explore Marketplace"}
                    </Button>
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto rounded-xl font-bold text-sm h-11 gap-2 cursor-pointer shadow-sm hover:scale-[1.01] transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      {"Get Started Free"}
                    </Button>
                  </SignInButton>
                )}
              </div>
            </div>

            {/* ── RIGHT SLIDESHOW DISPLAY COLUMN ── */}
            <div className="relative flex justify-center lg:justify-end w-full max-w-[440px] mx-auto lg:max-w-none">
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl rotate-45 blur-xl -z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl blur-xl scale-105 -z-10" />

              <div className="w-full relative shadow-lg rounded-2xl overflow-hidden border border-border/40">
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
