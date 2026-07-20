// components/navbar/GlobalNavbar.tsx
"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, ShoppingBag, Loader2 } from "lucide-react";
import { useNavbarRouting } from "./useNavbarRouting";

export function GlobalNavbar() {
  // 🎯 FIXED: Synchronized directly with your cleaned hook to instantly stop button duplication and leaks
  const {
    hasBusinessAccess,
    portalLabel,
    handlePortalNavigation,
    isNavigating,
  } = useNavbarRouting();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card text-card-foreground z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Brand Anchor Logo */}
        <Link
          href="/"
          className="font-black tracking-tighter text-lg text-foreground hover:opacity-90 transition-opacity shrink-0 select-none"
        >
          🍇 FreshPoint
        </Link>

        {/* Global Action Nodes */}
        <div className="flex items-center gap-4 ml-auto">
          <Link
            href="/explore"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 hidden sm:block"
          >
            Explore
          </Link>

          <Link
            href="/cart"
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg relative transition-colors shrink-0"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>

          {/* 🔐 Administrative Gate Anchor Button - Unified across layouts and securely hidden from regular accounts */}
          {hasBusinessAccess && (
            <button
              onClick={handlePortalNavigation}
              disabled={isNavigating}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground border border-primary/20 hover:opacity-90 shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              <span>{portalLabel}</span>
            </button>
          )}

          {isNavigating && (
            <Loader2 className="animate-spin h-4 w-4 text-primary shrink-0" />
          )}

          {/* Authentication State Wrapper */}
          <div className="flex items-center pl-2 border-l border-border h-6 shrink-0">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
