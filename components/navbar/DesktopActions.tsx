"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  CalendarDays,
  Sun,
  Moon,
  MapPin,
  ClipboardList,
  Search,
  LayoutDashboard,
  HelpCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

interface DesktopActionsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleDesktopSearch: (e: React.FormEvent) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  mounted: boolean;
  cartItemsCount: number;
  hasBusinessAccess: boolean;
  displayLabel: string;
  handlePortalNavigation: () => void;
  isNavigating: boolean;
  isSignedIn: boolean | undefined;
}

export function DesktopActions({
  searchQuery,
  setSearchQuery,
  handleDesktopSearch,
  theme,
  setTheme,
  mounted,
  cartItemsCount,
  hasBusinessAccess,
  displayLabel,
  handlePortalNavigation,
  isNavigating,
  isSignedIn,
}: DesktopActionsProps): React.JSX.Element {
  const guardedLinkClass =
    "flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none cursor-pointer border-none bg-transparent outline-none";

  return (
    <div className="hidden md:flex flex-1 items-center justify-between gap-7 w-full min-w-0">
      {/* CENTRAL SEARCH BAR */}
      <div className="flex-1 max-w-sm min-w-0">
        <form
          onSubmit={handleDesktopSearch}
          className="flex items-center gap-2 bg-muted/80 border border-border rounded-xl px-3 h-9 focus-within:border-primary w-full transition-all duration-200"
        >
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search spas, treatments, salons..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="bg-transparent outline-none flex-1 text-xs text-foreground placeholder:text-muted-foreground min-w-0 border-0"
          />
        </form>
      </div>

      {/* ICON INTERACTION CONTROLS */}
      <div className="flex items-center gap-6 flex-shrink-0">
        {/* 🌟 DESKTOP WORKSPACE RE-ENTRY TRIGGER */}
        {hasBusinessAccess && (
          <Button
            onClick={handlePortalNavigation}
            disabled={isNavigating}
            variant="outline"
            className="lg:hidden h-8.5 px-3 rounded-xl text-[11px] font-bold gap-1.5 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 cursor-pointer transition-all duration-200"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{displayLabel}</span>
          </Button>
        )}

        <Link
          href="/explore"
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
        >
          <div className="p-0.5">
            <MapPin className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
          </div>
          <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
            Browse
          </span>
        </Link>

        {/* Track Orders — sign-in guarded */}
        {isSignedIn ? (
          <Link
            href="/orders/history"
            className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors border-r border-border/60 pr-5 select-none"
          >
            <div className="p-0.5">
              <ClipboardList className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
            </div>
            <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80 whitespace-nowrap">
              Track Orders
            </span>
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button
              type="button"
              className={`${guardedLinkClass} border-r border-border/60 pr-5`}
            >
              <div className="p-0.5">
                <ClipboardList className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
              </div>
              <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80 whitespace-nowrap">
                Track Orders
              </span>
            </button>
          </SignInButton>
        )}

        {/* Cart — sign-in guarded */}
        {isSignedIn ? (
          <Link
            href="/cart"
            className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
          >
            <div className="relative p-0.5">
              <ShoppingCart className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border border-background shadow-sm">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
              Cart
            </span>
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button type="button" className={guardedLinkClass}>
              <div className="relative p-0.5">
                <ShoppingCart className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
              </div>
              <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
                Cart
              </span>
            </button>
          </SignInButton>
        )}

        {/* Bookings — sign-in guarded */}
        {isSignedIn ? (
          <Link
            href="/bookings"
            className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
          >
            <div className="p-0.5">
              <CalendarDays className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
            </div>
            <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
              Bookings
            </span>
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button type="button" className={guardedLinkClass}>
              <div className="p-0.5">
                <CalendarDays className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
              </div>
              <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
                Bookings
              </span>
            </button>
          </SignInButton>
        )}

        <Link
          href="/contact"
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
        >
          <div className="p-0.5">
            <HelpCircleIcon className="w-4.5 h-4.5 group-hover:scale-105 transition-transform shrink-0" />
          </div>
          <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
            Support
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors cursor-pointer border-none bg-transparent outline-none"
        >
          <div className="p-0.5">
            {mounted && theme === "dark" ? (
              <Sun className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform shrink-0" />
            ) : (
              <Moon className="w-4.5 h-4.5 group-hover:-rotate-12 transition-transform shrink-0" />
            )}
          </div>
          <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase opacity-80 whitespace-nowrap">
            {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>
    </div>
  );
}
