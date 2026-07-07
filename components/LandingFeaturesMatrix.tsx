"use client";

import * as React from "react";
import {
  Sparkles,
  Users,
  Briefcase,
  Shield,
  Zap,
  LayoutDashboard,
  Truck,
} from "lucide-react";

export default function LandingFeaturesMatrix() {
  return (
    <section className="relative py-12 md:py-16 px-6 max-w-7xl mx-auto border-t border-border/40">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10 mb-4">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {"Platform Ecosystem"}
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
          {"One Central Hub. Built for Both Sides."}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2 font-medium">
          {
            "Explore how Freshpoint unifies luxury self-care convenience for clients with institutional management suites for shop operators."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── CLIENT CAPABILITIES MATRIX ── */}
        <div className="p-6 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-black text-base text-foreground tracking-tight">
              {"For Customers & Patrons"}
            </h3>
          </div>

          <ul className="space-y-3 text-xs text-muted-foreground font-medium">
            <li className="flex gap-2.5">
              <Zap className="w-4 h-4 text-primary shrink-0" />{" "}
              <span>
                {
                  "Browse local verified salons, specialized beauty treatments, and wellness centers side-by-side."
                }
              </span>
            </li>
            <li className="flex gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />{" "}
              <span>
                {
                  "Add retail products and premium treatment reservations into a unified, cross-tenant checkout line."
                }
              </span>
            </li>
            <li className="flex gap-2.5">
              <Shield className="w-4 h-4 text-primary shrink-0" />{" "}
              <span>
                {
                  "Review and check performance stars left directly by real customers before completing your booking."
                }
              </span>
            </li>
          </ul>
        </div>

        {/* ── PROVIDER CAPABILITIES MATRIX ── */}
        <div className="p-6 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            {/* 🌟 FIXED: Changed from UserTie to Briefcase to resolve the undefined icon crash loop */}
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-black text-base text-foreground tracking-tight">
              {"For Space Owners & Retailers"}
            </h3>
          </div>

          <ul className="space-y-3 text-xs text-muted-foreground font-medium">
            <li className="flex gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />{" "}
              <span>
                {
                  "Institutional Multi-Tenant Dashboard to oversee booking slots, assign staff roles, and track earnings."
                }
              </span>
            </li>
            <li className="flex gap-2.5">
              <Shield className="w-4 h-4 text-primary shrink-0" />{" "}
              <span>
                {
                  "Moderate and toggle visibility of customer feedback rows left on your storefront profile timeline."
                }
              </span>
            </li>
            <li className="flex gap-2.5">
              <Truck className="w-4 h-4 text-primary shrink-0" />{" "}
              <span>
                {
                  "Calculate precise doorstep shipping rates automatically based on driving distance coordinates via map metrics."
                }
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
