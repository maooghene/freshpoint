"use client";

import { CheckIcon, Sparkles, ZapIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pricingPlans = [
  {
    name: "Starter Provider",
    price: "0",
    description:
      "Perfect for independent wellness professionals and individual specialists.",
    features: [
      "Up to 20 Bookings/mo",
      "Basic Analytics Dashboard",
      "Multi-tenant Path Profile",
      "Email Notifications",
    ],
    icon: Sparkles,
    buttonVariant: "outline" as const,
  },
  {
    name: "Pro Space",
    price: "25,000",
    description:
      "Best for growing salons, spas, and teams with multiple specialists.",
    features: [
      "Unlimited Bookings",
      "Advanced Financial Analytics",
      "Paystack & PayPal Gateways",
      "Automated Client Notifications",
      "Priority Tenant Support",
    ],
    icon: ZapIcon,
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise Ecosystem",
    price: "Custom",
    description: "For large wellness franchises and multi-location operations.",
    features: [
      "Multi-location Management",
      "Whitelabel Custom Branding",
      "Full Inventory & API Access",
      "Dedicated Account Success Manager",
    ],
    icon: ShieldCheck,
    buttonVariant: "outline" as const,
  },
];

export default function PricingPage() {
  const currency = "₦";

  return (
    <div className="relative min-h-screen py-24 overflow-hidden bg-background text-foreground">
      {/* BULLETPROOF BACKGROUND GRID PATTERN & GRADIENT ORBS */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 
          bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] 
          dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] 
          bg-[size:4rem_4rem] 
          [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* HEADER */}
        <div className="text-center space-y-4 mb-16">
          <Badge
            variant="outline"
            className="rounded-full border-primary/20 bg-primary/5 text-primary px-4 py-1 font-semibold"
          >
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Scale your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Wellness Business
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm font-medium leading-relaxed">
            Choose the workspace plan that fits your operation. All premium
            configurations include a 14-day comprehensive trial period.
          </p>
        </div>

        {/* PRICING PLANS GRID */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-300 hover:scale-[1.01] ${
                plan.popular
                  ? "bg-card border-primary shadow-2xl shadow-primary/20 z-10"
                  : "bg-card/40 backdrop-blur-xl border-border/80 hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div className="p-3 bg-primary/10 w-fit rounded-2xl">
                  <plan.icon className="text-primary size-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    {plan.price !== "Custom" && (
                      <span className="text-2xl font-bold text-foreground">
                        {currency}
                      </span>
                    )}
                    <span className="text-4xl font-black tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span className="text-muted-foreground text-xs font-semibold">
                        /month
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-border">
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm font-medium text-foreground/90"
                    >
                      <div className="bg-primary/20 rounded-full p-0.5 shrink-0">
                        <CheckIcon
                          className="text-primary size-3"
                          strokeWidth={4}
                        />
                      </div>
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant={plan.buttonVariant}
                size="lg"
                className={`w-full mt-10 rounded-2xl font-bold h-14 transition-all cursor-pointer ${
                  plan.popular
                    ? "shadow-xl shadow-primary/20 hover:shadow-2xl"
                    : "border-border"
                }`}
              >
                Get Started Free
              </Button>
            </div>
          ))}
        </div>

        {/* PAYMENTS COMPLIANT CAPTIONFOOTER */}
        <p className="text-center mt-12 text-xs text-muted-foreground font-medium">
          Prices are displayed in Nigerian Naira ({currency}). Safe transactions
          processed securely via **Paystack, PayPal, or Stripe**.
        </p>
      </div>
    </div>
  );
}
