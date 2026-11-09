"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

// A deep indigo band that looks the same in light and dark mode, so the page
// ends on a solid, branded block instead of fading into the background.
const linkClass =
  "flex min-h-10 items-center text-sm text-white/70 transition-colors hover:text-white active:text-white";

const headingClass = "text-xs font-semibold uppercase tracking-widest text-white/45";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-[#1a1030] text-[#F6F2E8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Call to action */}
        <div className="flex flex-col gap-5 border-b border-white/10 py-9 sm:py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-1.5">
            <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Run a service business?
            </h3>
            <p className="text-sm leading-relaxed text-white/65 sm:text-base">
              Take bookings, manage staff and sell products from one place.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/register-business"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F6F2E8] px-6 text-sm font-bold text-[#1a1030] transition-transform active:scale-95 hover:bg-white"
            >
              Register your business
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/10"
            >
              Explore providers
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 py-9 sm:py-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label="FreshPoint home"
            >
              <Image
                src="/freshpoint-mark.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-black tracking-tight">
                FreshPoint
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/65">
              Book services and order products from trusted providers near you.
            </p>
          </div>

          <nav aria-label="Platform" className="space-y-2">
            <h4 className={headingClass}>Platform</h4>
            <ul>
              <li>
                <Link href="/explore" className={linkClass}>
                  Explore providers
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className={linkClass}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#for-owners" className={linkClass}>
                  For providers
                </Link>
              </li>
              <li>
                <Link href="/register-business" className={linkClass}>
                  Register your business
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Support and legal" className="space-y-2">
            <h4 className={headingClass}>Support</h4>
            <ul>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of service
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-2 border-t border-white/10 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {"©"} {currentYear} FreshPoint. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Payments secured by Paystack
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
