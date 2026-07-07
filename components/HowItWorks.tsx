"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRightIcon,
  MousePointerClickIcon,
  SearchIcon,
  ZapIcon,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function HowItWorks() {
  const { user } = useUser();

  return (
    <section
      id="how-it-works"
      className="relative py-12 md:py-16 px-6 outline-hidden z-10 max-w-7xl mx-auto border-t border-border/40"
    >
      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10 backdrop-blur-sm mb-4">
          <ZapIcon className="size-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {"Simple Process"}
          </span>
        </div>

        <h2 className="text-2xl md:text-4xl font-black mb-3 tracking-tight leading-[1.15]">
          <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {"Four steps to"}
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {"your perfect self-care day"}
          </span>
        </h2>

        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
          {
            "Freshpoint makes it effortless to find local wellness spaces, book premium treatments, buy products, and select your preferred delivery or pick-up methods — all in one centralized app."
          }
        </p>
      </div>

      {/* STEPS MATRIX GRID (SCALES DENSELY TO 2X2 OR 4X1) */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* STEP 1: DISCOVER */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-5 border border-border/50 hover:border-primary/20 transition-all duration-300 h-full flex flex-row sm:flex-col items-center sm:items-start sm:text-left gap-4 sm:gap-0">
              <div className="absolute -top-2 left-4 w-5 h-5 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black shadow-md z-20">
                1
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 p-2.5">
                <SearchIcon className="w-full h-full text-primary" />
              </div>
              <div className="flex-1 min-w-0 sm:space-y-1">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {"Discover Spaces"}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  {
                    "Explore local verified salons, premium spas, and specialized health venues matching your community coordinates."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: SELECT & CUSTOMIZE */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-5 border border-border/50 hover:border-primary/20 transition-all duration-300 h-full flex flex-row sm:flex-col items-center sm:items-start sm:text-left gap-4 sm:gap-0">
              <div className="absolute -top-2 left-4 w-5 h-5 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black shadow-md z-20">
                2
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 p-2.5">
                <MousePointerClickIcon className="w-full h-full text-primary" />
              </div>
              <div className="flex-1 min-w-0 sm:space-y-1">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {"Select & Customize"}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  {
                    "Choose a premium treatment session or add top-tier cosmetic retail items straight into your cross-tenant checkout cart."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* STEP 3: FULFILLMENT INTERCEPT */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-5 border border-border/50 hover:border-primary/20 transition-all duration-300 h-full flex flex-row sm:flex-col items-center sm:items-start sm:text-left gap-4 sm:gap-0">
              <div className="absolute -top-2 left-4 w-5 h-5 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black shadow-md z-20">
                3
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 p-2.5">
                <Truck className="w-full h-full text-primary" />
              </div>
              <div className="flex-1 min-w-0 sm:space-y-1">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {"Choose Pickup or Delivery"}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  {
                    "Select self-pickup from the provider's store or request dynamic distance-based doorstep delivery complete with courier contact details."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4: BOOK & CONFIRM */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-5 border border-border/50 hover:border-primary/20 transition-all duration-300 h-full flex flex-row sm:flex-col items-center sm:items-start sm:text-left gap-4 sm:gap-0">
              <div className="absolute -top-2 left-4 w-5 h-5 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black shadow-md z-20">
                4
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 p-2.5">
                <CheckCircle2 className="w-full h-full text-primary" />
              </div>
              <div className="flex-1 min-w-0 sm:space-y-1">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {"Secure & Enjoy"}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  {
                    "Lock in your confirmation verified cleanly via secure Paystack processing channels. Arrive relaxed or wait for tracking invoices."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA BUTTON */}
      <div className="text-center mt-10">
        {!user ? (
          <SignInButton mode="modal">
            <Button
              size="lg"
              className="rounded-xl font-bold text-sm h-11 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <ArrowRightIcon className="mr-1.5 size-4" />
              {"Get started with Freshpoint"}
            </Button>
          </SignInButton>
        ) : (
          <Link href="/explore">
            <Button
              size="lg"
              className="rounded-xl font-bold text-sm h-11 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <ArrowRightIcon className="mr-1.5 size-4" />
              {"Get started with Freshpoint"}
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

export default HowItWorks;
