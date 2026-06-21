"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRightIcon,
  Calendar1,
  MousePointerClickIcon,
  SearchIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function HowItWorks() {
  const { user } = useUser();

  return (
    <section
      id="how-it-works"
      className="relative py-32 px-6 outline-hidden z-10 max-w-7xl mx-auto"
    >
      {/* HEADER */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10 backdrop-blur-sm mb-6">
          <ZapIcon className="size-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Simple Process
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Three steps to
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            your perfect self-care day
          </span>
        </h2>

        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Freshpoint makes it effortless to find wellness spaces, book premium
          treatments, and order products — all in one centralized app.
        </p>
      </div>

      {/* STEPS */}
      <div className="relative">
        {/* CONNECTION LINE */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent transform -translate-y-1/2 hidden lg:block"></div>

        <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
          {/* STEP 1 */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute -top-4 left-8 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                1
              </div>

              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 mb-6">
                <SearchIcon className="w-full h-12 text-primary" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-center">
                Discover Spaces
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Explore local salons, premium spas, and specialized wellness
                centers. Browse services, retail products, and verified reviews.
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Top Providers
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Real Reviews
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute -top-4 left-8 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                2
              </div>

              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 mb-6">
                <MousePointerClickIcon className="w-full h-12 text-primary" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-center">
                Select & Customize
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Pick your desired treatments, select your preferred staff
                specialist, or add essential wellness products to your
                multi-tenant cart.
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Custom Sessions
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Product Sales
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute -top-4 left-8 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                3
              </div>

              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 mb-6">
                <Calendar1 className="w-full h-12 text-primary" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-center">
                Book & Enjoy
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Lock in your time slot with seamless instant confirmation.
                Arrive relaxed at your chosen venue without long waiting
                periods.
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Instant Access
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Zero Delays
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="text-center mt-16">
        {!user ? (
          <SignInButton mode="modal">
            <Button
              size="lg"
              className="rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowRightIcon className="mr-2 size-5" />
              Get started with Freshpoint
            </Button>
          </SignInButton>
        ) : (
          <Link href="/explore">
            <Button
              size="lg"
              className="rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowRightIcon className="mr-2 size-5" />
              Get started with Freshpoint
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

export default HowItWorks;
