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
} from "lucide-react";

interface DesktopActionsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleDesktopSearch: (e: React.FormEvent) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  mounted: boolean;
  cartItemsCount: number;
}

export function DesktopActions({
  searchQuery,
  setSearchQuery,
  handleDesktopSearch,
  theme,
  setTheme,
  mounted,
  cartItemsCount,
}: DesktopActionsProps) {
  return (
    <div className="hidden md:flex flex-1 items-center justify-between gap-6 w-full">
      {/* 🔍 DESKTOP CENTRAL SEARCH BAR LAYER */}
      <div className="flex-1 max-w-md mx-auto w-full">
        <form
          onSubmit={handleDesktopSearch}
          className="flex items-center gap-3 bg-muted/80 border border-border rounded-xl px-4 py-2 focus-within:border-primary w-full"
        >
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search spas, treatments, salons..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </form>
      </div>

      {/* ICON INTERACTION CONTROLS */}
      <div className="flex items-center gap-5 flex-shrink-0">
        <Link
          href="/explore"
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
        >
          <div className="p-1">
            <MapPin className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
            Browse
          </span>
        </Link>

        <Link
          href="/orders/history"
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors border-r border-border pr-4 select-none"
        >
          <div className="p-1">
            <ClipboardList className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] font-bold tracking-wide mt-0.5 uppercase opacity-80 whitespace-nowrap">
            Track Orders
          </span>
        </Link>

        <Link
          href="/cart"
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
        >
          <div className="relative p-1">
            <ShoppingCart className="w-5 h-5 group-hover:scale-105 transition-transform" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-background animate-pulse shadow-sm">
                {cartItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
            Cart
          </span>
        </Link>

        <Link
          href="/appointments/history"
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors select-none"
        >
          <div className="p-1">
            <CalendarDays className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] font-bold tracking-wide mt-0.5 uppercase opacity-80">
            Bookings
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center group text-muted-foreground hover:text-primary transition-colors cursor-pointer border-none bg-transparent outline-none"
        >
          <div className="p-1">
            {mounted && theme === "dark" ? (
              <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-wide mt-0.5 uppercase opacity-80 whitespace-nowrap">
            {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>
    </div>
  );
}
