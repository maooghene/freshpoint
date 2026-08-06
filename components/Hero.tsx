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
    <section className="relative h-[85vh] min-h-[560px] flex items-center overflow-hidden">
      {/* Full-bleed slideshow background */}
      <HeroSlideshow />

      <div className="relative z-30 w-full px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 select-none">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                The All-In-One Merchant Ecosystem
              </span>
            </div>

            {user ? (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
                {timeGreeting},{" "}
                <span className="text-primary">{displayName}</span>
              </h1>
            ) : (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-white drop-shadow-lg">
                Find premium{" "}
                <span className="text-primary">products & services</span>{" "}
                instantly
              </h1>
            )}

            <p className="text-sm sm:text-base text-white/85 leading-relaxed font-medium max-w-lg drop-shadow">
              {user
                ? "Ready to explore the marketplace? Discover premium fashion brands, local shops, and secure professional appointments near you."
                : "Discover exceptional local brands, buy premium fashion items, and secure expert appointments in seconds."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link href="/explore" className="w-full sm:w-auto select-none">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-xl font-bold text-sm h-11 gap-2 cursor-pointer shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  {user ? "Explore Marketplace" : "Shop & Book Now"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
