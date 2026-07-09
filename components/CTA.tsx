"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { CtaTabs } from "./CtaTabs";
import { CtaDashboardPreview } from "./CtaDashboardPreview";

type PreviewTabMode = "BOOKINGS" | "PRODUCTS" | "DELIVERIES";

export default function CTA(): React.JSX.Element {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<PreviewTabMode>("BOOKINGS");

  // 🎯 MASTER-LEVEL TWCSS AUTOMATED CAROUSEL ROTATOR
  useEffect(() => {
    // Array order maps exactly to Calendar (BOOKINGS) -> E-Commerce (PRODUCTS) -> Deliveries (DELIVERIES)
    const tabsOrder: PreviewTabMode[] = ["BOOKINGS", "PRODUCTS", "DELIVERIES"];

    const intervalId = setInterval(() => {
      setActiveTab((currentTab) => {
        const currentIndex = tabsOrder.indexOf(currentTab);
        const nextIndex = (currentIndex + 1) % tabsOrder.length;
        return tabsOrder[nextIndex];
      });
    }, 3500); // Rotates smoothly every 3.5 seconds

    // Clear the thread lifecycle instantly on unmount to safeguard memory footprints
    return () => clearInterval(intervalId);
  }, []);

  const handleOnboardingRedirect = async (): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      /*
        🎯 THE ABSOLUTE ROUTING REDIRECTION FIX:
        We push the authenticated user who explicitly clicked "Set Up Your Space" 
        straight to our unified "/register-business" endpoint.
      */
      router.push("/register-business");
    } catch (_err: unknown) {
      router.push("/register-business");
    } finally {
      setIsLoading(false);
    }
  };

  // Guard compilation states against raw hydration shifts
  if (!isLoaded) {
    return (
      <section className="relative py-12 px-6 bg-gradient-to-br from-muted/5 via-background to-muted/10 border-t border-border/40">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            {"Loading Workspace Modules..."}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="for-owners"
      className="relative py-12 px-6 overflow-hidden bg-gradient-to-br from-muted/5 via-background to-muted/10 border-t border-border/40"
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Content Block */}
          <div className="space-y-5 text-center lg:text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10 mx-auto lg:mx-0">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {"Built for Retailers &amp; Service Providers"}
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                {"Scale your workspace, sell or book effortlessly"}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                {
                  "Whether you run a luxury salon needing live calendar schedules, an automated beauty storefront shipping products, or want to offer your clients distance-based doorstep delivery options—Freshpoint acts as your financial command engine. Let clients choose between in-store pickup or delivery, and we automatically calculate and collect logistics fees for you."
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              {!user ? (
                /* 
                  🎯 THE SIGN-IN FALLBACK FIX:
                  Changed fallbackRedirectUrl from "/register-business" to "/" (Home).
                  This allows casual visitors to sign up or sign in cleanly without getting 
                  trapped inside the vendor registration flow.
                */
                <SignInButton mode="modal" fallbackRedirectUrl="/">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-bold bg-primary rounded-xl cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {"List Your Business"}
                  </Button>
                </SignInButton>
              ) : (
                /* If they are already signed in, clicking this explicitly initiates onboarding */
                <Button
                  size="lg"
                  onClick={() => {
                    void handleOnboardingRedirect();
                  }}
                  disabled={isLoading}
                  className="w-full sm:w-auto font-bold bg-primary rounded-xl flex items-center justify-center cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Verifying Account..." : "Set Up Your Space"}
                </Button>
              )}
            </div>
          </div>

          {/* Graphical Tabs Preview Box Side */}
          <div className="relative flex flex-col justify-center items-center lg:items-end w-full max-w-[460px] mx-auto lg:max-w-none gap-3">
            <CtaTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <CtaDashboardPreview activeTab={activeTab} />
          </div>
        </div>
      </div>
    </section>
  );
}
