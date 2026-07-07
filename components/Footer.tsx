"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    // 🌟 FIXED: Balanced padding (pt-8 pb-4) brings back professional content columns while staying lightweight
    <footer className="w-full border-t border-border/50 bg-muted/20 px-6 pt-8 pb-4 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Upper Frame: Clean Multi-Column Info Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          {/* Corporate Context Column */}
          <div className="col-span-2 md:col-span-1 space-y-2">
            <div className="flex items-center gap-1.5 text-primary font-sans font-bold text-sm tracking-tight">
              <Sparkles className="size-4 shrink-0" />
              <span>Freshpoint</span>
            </div>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Multi-tenant ecosystem for modern wellness businesses. Manage
              appointments, staff schedules, and retail items effortlessly.
            </p>
          </div>

          {/* Product Nav Grid Node */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground tracking-wide uppercase text-[10px] text-primary/80">
              Product
            </h4>
            <ul className="space-y-1.5 font-medium text-muted-foreground">
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="#for-owners"
                  className="hover:text-foreground transition-colors"
                >
                  For Providers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Operations Grid Node */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground tracking-wide uppercase text-[10px] text-primary/80">
              Support
            </h4>
            <ul className="space-y-1.5 font-medium text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance Info Grid Node */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground tracking-wide uppercase text-[10px] text-primary/80">
              Legal
            </h4>
            <ul className="space-y-1.5 font-medium text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Data Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Frame: Clean Baseline Row Wrapper */}
        <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground/60">
          <p>
            {"\u00A9"} {currentYear} Freshpoint. Connecting providers,
            specialists, and clients seamlessly.
          </p>
          <p className="font-mono text-[10px]">v1.2.0 • Secured Transactions</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
