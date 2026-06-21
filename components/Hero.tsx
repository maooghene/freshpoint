"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { CalendarIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { getTimeBasedGreeting } from "@/lib/greetings";

function Hero() {
  const { user } = useUser();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden pt-16">
      {/* GRID BG */}
      {/* GRID BG - Bulletproof Light & Dark Mode Contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-primary/5">
        <div
          className="absolute inset-0 
    bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] 
    dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] 
    bg-[size:4rem_4rem] 
    [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        />
      </div>

      {/* GRADIENT ORBS */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-r from-primary/15 to-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT CONTENT */}
            <div className="space-y-10">
              <div className="space-y-6">
                {/* BADGE */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full border border-primary/20 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-primary">
                    Smart Booking for Wellness Spaces
                  </span>
                </div>

                {/* MAIN HEADING - Conditional based on login status */}
                {user ? (
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                      {getTimeBasedGreeting()},{" "}
                    </span>
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {user?.firstName}
                    </span>
                  </h1>
                ) : (
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                      Find top-tier{" "}
                    </span>

                    <span className="inline">
                      <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        wellness spaces{" "}
                      </span>

                      <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                        and book instantly
                      </span>
                    </span>
                  </h1>
                )}

                {/* SUBTITLE */}
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl font-medium">
                  {user
                    ? "Ready to prioritize your self-care today? Explore premier salons, spas, and wellness spaces near you."
                    : "Discover exceptional wellness providers, secure open slots in seconds, and track your self-care routine with ease. Built for clients and business owners."}
                </p>
              </div>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Customer CTA */}
                {user ? (
                  <Link href="/explore">
                    <Button
                      size={"lg"}
                      className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <CalendarIcon className="mr-2 size-5" />
                      Book Appointment
                    </Button>
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <Button
                      size={"lg"}
                      className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Sparkles className="mr-2 size-5" />
                      Get Started Free
                    </Button>
                  </SignUpButton>
                )}
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="relative flex justify-center lg:justify-end ">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl rotate-45 blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-xl scale-110"></div>

              <Image
                src="/wellness-hero.jpg"
                alt="Freshpoint Multi-tenant Booking Interface"
                width={450}
                height={450}
                className="m-4 rounded-2xl border-4 border-muted/20 shadow-2xl bg-background"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
