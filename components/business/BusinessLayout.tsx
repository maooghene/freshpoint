// src/components/business/BusinessLayout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboardIcon,
  CalendarCheckIcon,
  ClockIcon,
  PlusCircleIcon,
  LayersIcon,
  MenuIcon,
} from "lucide-react";
import { useState } from "react";

interface BusinessLayoutProps {
  children: React.ReactNode;
  businessSlug: string;
}

export default function BusinessLayout({
  children,
  businessSlug,
}: BusinessLayoutProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Core navigation routing blueprint mapped cleanly using your active multi-tenant workspace parameter
  const navigationItems = [
    {
      name: "Dashboard",
      href: `/business/${businessSlug}`,
      icon: LayoutDashboardIcon,
      exact: true,
    },
    {
      name: "Bookings",
      href: `/business/${businessSlug}/bookings`,
      icon: CalendarCheckIcon,
    },
    {
      name: "Business Hours",
      href: `/business/${businessSlug}/schedule`,
      icon: ClockIcon,
    },
    {
      name: "Add New Item",
      href: `/business/${businessSlug}/add-service`,
      icon: PlusCircleIcon,
    },
    {
      name: "Manage Catalog",
      href: `/business/${businessSlug}/manage-items`,
      icon: LayersIcon,
    },
  ];

  const checkActive = (item: (typeof navigationItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* MOBILE HEADER LAYER */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 bg-card border-b border-border z-20">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Fresh Point
          </span>
        </div>
        <div className="flex items-center gap-4">
          <UserButton />
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 border border-border rounded-xl bg-secondary/50 text-foreground"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION PANELS (Desktop vs Mobile handling) */}
      <aside
        className={`
        fixed inset-y-0 left-0 transform ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-card border-r border-border flex flex-col p-6 z-30 md:z-10
      `}
      >
        {/* LOGO AREA */}
        <div className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-border">
          <span className="font-black text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Fresh Point
          </span>
        </div>

        {/* NAVIGATION LINKS GRID */}
        <nav className="flex-1 space-y-1">
          {navigationItems.map((item) => {
            const isActive = checkActive(item);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* PROFILE/FOOTER LOCK AREA */}
        <div className="hidden md:flex items-center gap-3 pt-4 border-t border-border mt-auto">
          <UserButton />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground truncate">
              Workspace Settings
            </span>
            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">
              {businessSlug}
            </span>
          </div>
        </div>
      </aside>

      {/* BACKDROP OVERLAY FOR CLOSING MOBILE NAVIGATION */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* CORE WORKSPACE MAIN CONTENT WINDOW */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
