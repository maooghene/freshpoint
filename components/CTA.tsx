"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { CtaTabs } from "./CtaTabs";
import { CtaDashboardPreview } from "./CtaDashboardPreview";

type PreviewTabMode = "BOOKINGS" | "PRODUCTS" | "DELIVERIES";

export default function CTA() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<PreviewTabMode>("BOOKINGS");

  const handleOnboardingRedirect = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/check-onboarding");
      if (!res.ok) {
        router.push("/register-business");
        return;
      }
      const data = await res.json();
      router.push(data.destination);
    } catch (_err: unknown) {
      router.push("/register-business");
    } finally {
      setIsLoading(false);
    }
  };

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
                  {"Built for Retailers & Service Providers"}
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                {"Scale your workspace, sell or book effortlessly"}
              </h2>
              {/* 🌟 FIXED: Tailored marketing copy explicitly targets decentralized vendor-controlled delivery settings */}
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                {
                  "Whether you run a luxury salon needing live calendar schedules, an automated beauty storefront shipping products, or want to offer your clients distance-based doorstep delivery options—Freshpoint acts as your financial command engine. Let clients choose between in-store pickup or delivery, and we automatically calculate and collect logistics fees for you."
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              {!user ? (
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-bold bg-primary rounded-xl cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {"List Your Business"}
                  </Button>
                </SignInButton>
              ) : (
                <Button
                  size="lg"
                  onClick={handleOnboardingRedirect}
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
