"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";

function CTA() {
  const { user } = useUser();

  return (
    <section
      id="for-owners"
      className="relative py-20 px-6 overflow-hidden bg-gradient-to-br from-muted/10 via-background to-muted/5"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.03),transparent_70%)]"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-primary">
                  Built for Wellness Professionals
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Grow your business,
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  manage clients effortlessly
                </span>
              </h2>

              {/* Description */}
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join salons, spas, and wellness spaces using Freshpoint to
                automate appointments, sell products, and scale operations.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!user ? (
                <SignInButton mode="modal">
                  <Button
                    size="lg"
                    className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    List Your Business
                  </Button>
                </SignInButton>
              ) : (
                <Link href="/register-business">
                  <Button
                    size="lg"
                    className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Set Up Your Space
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Floating Badge */}
              <div className="absolute -top-4 left-4 bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-10">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  Real-time booking active
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-xl scale-110"></div>

                <Image
                  src="/wellness-dashboard.jpg"
                  alt="Freshpoint Wellness Booking System Dashboard"
                  width={500}
                  height={400}
                  className="w-full max-w-[500px] h-auto rounded-2xl border-4 border-muted/20 shadow-2xl bg-background"
                  priority
                />
              </div>

              {/* Decorative element */}
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
