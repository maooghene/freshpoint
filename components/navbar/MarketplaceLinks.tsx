"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, ClipboardList, Menu, X } from "lucide-react";

export function MarketplaceLinks() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>(
    searchParams?.get("search") || "",
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    router.push(
      searchQuery.trim()
        ? `/explore?search=${encodeURIComponent(searchQuery)}`
        : "/explore",
    );
  };

  return (
    <div className="flex items-center justify-end md:flex-1 md:justify-center">
      {/* ── HAMBURGER ACTION TRIGGER BUTTON ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 cursor-pointer transition-colors z-50 relative"
        aria-label="Toggle navigation options panel"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── PERSISTENT DESKTOP VIEW CONTAINER ── */}
      <div className="hidden md:flex items-center gap-6 w-full max-w-xl justify-center">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 border border-border/50 focus-within:border-primary/50 w-full max-w-sm"
        >
          <Search size={18} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search spas, salons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 text-sm text-foreground"
          />
        </form>
        <Link
          href="/explore"
          className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
        >
          <MapPin size={16} /> Browse all
        </Link>
        <Link
          href="/orders/history"
          className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 border-l border-border pl-4 whitespace-nowrap"
        >
          <ClipboardList size={16} className="text-primary/80" /> Track Orders
        </Link>
      </div>

      {/* ── REFACTORED CENTRALISED FIXED VIEWPORT MOBILE OVERLAY ── */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-md z-40 flex flex-col p-6 animate-fadeIn transition-all">
          <div className="w-full max-w-sm mx-auto space-y-6 pt-4">
            {/* Context Header Label */}
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                Marketplace Menu
              </h2>
              <p className="text-xs text-muted-foreground">
                Discover services and track checkouts instantly
              </p>
            </div>

            {/* Centralized Full-Width Search Input Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 bg-muted/80 border border-border rounded-xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all w-full"
            >
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search services, shops, treatments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground w-full"
              />
            </form>

            {/* Fully Center-Aligned Navigation Actions List */}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/explore"
                onClick={() => setIsOpen(false)}
                className="text-foreground hover:text-primary text-sm font-bold flex items-center justify-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors shadow-2xs"
              >
                <MapPin size={16} className="text-primary" />
                <span>Browse Marketplace Catalog</span>
              </Link>

              <Link
                href="/orders/history"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground text-sm font-bold flex items-center justify-center gap-2.5 p-4 rounded-xl bg-primary hover:opacity-90 transition-all shadow-sm"
              >
                <ClipboardList size={16} />
                <span>Track My Active Orders</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
