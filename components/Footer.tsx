"use client";

import Link from "next/link";
import * as React from "react";
import { Sparkles } from "lucide-react";

// Every link is a real page. Tap targets are at least 40px tall for phones.
const linkClass =
  "flex min-h-10 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-foreground";

const headingClass =
  "text-[11px] font-bold uppercase tracking-widest text-primary/80";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/50 bg-muted/20 px-4 sm:px-6 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
          {/* Brand */}
          <div className="col-span-2 space-y-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-primary font-bold text-base tracking-tight"
            >
              <Sparkles className="size-4 shrink-0" />
              <span>Freshpoint</span>
            </Link>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
              Book services and order products from trusted local providers, or
              run your own business with bookings, staff and orders in one
              place.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product" className="space-y-1">
            <h4 className={headingClass}>Product</h4>
            <ul>
              <li>
                <Link href="/explore" className={linkClass}>
                  Explore Providers
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className={linkClass}>
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/#for-owners" className={linkClass}>
                  For Providers
                </Link>
              </li>
              <li>
                <Link href="/register-business" className={linkClass}>
                  Register Your Business
                </Link>
              </li>
            </ul>
          </nav>

          {/* Support & legal */}
          <nav aria-label="Support and legal" className="space-y-1">
            <h4 className={headingClass}>Support</h4>
            <ul>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs font-medium text-muted-foreground/70">
          <p>
            {"©"} {currentYear} Freshpoint. All rights reserved.
          </p>
          <p>Payments secured by Paystack</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
