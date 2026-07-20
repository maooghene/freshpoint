// components/business/staff/StaffSidebar.tsx
"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import StaffSidebarContent from "./sidebar/StaffSidebarContent";

interface StaffSidebarProps {
  businessName: string;
  businessSlug: string;
  user: { firstName?: string | null } | null | undefined;
}

export default function StaffSidebar({
  businessName,
  user,
}: StaffSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    React.useState<boolean>(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile & Medium Viewport Floating Header Bar */}
      <header className="flex lg:hidden fixed top-0 left-0 right-0 z-30 h-16 items-center justify-end border-b border-border bg-card px-4 md:px-8">
        {/* Absolute Centered Business Name Row */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-[55vw] sm:max-w-[65vw] min-w-0">
          <span className="block truncate font-black text-xs sm:text-sm text-foreground tracking-wider uppercase">
            {businessName}
          </span>
        </div>

        {/* Trigger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/40 text-foreground hover:bg-secondary transition-colors z-10"
          aria-label="Open workforce menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop Sidebar View Container Context (Permanent at lg: 1024px+) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-border bg-card">
        <StaffSidebarContent
          businessName={businessName}
          user={user}
          onCloseMobileMenu={closeMobileMenu}
        />
      </aside>

      {/* Mobile & Medium Viewport Backdrop Overlay Drawer Mask */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />
      )}

      {/* Mobile & Medium Viewport Sliding Navigation Drawer Panel Element - Ultra-Slim Mobile Override */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[58vw] sm:w-64 md:w-64 transform border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <StaffSidebarContent
          businessName={businessName}
          user={user}
          onCloseMobileMenu={closeMobileMenu}
        />
      </aside>
    </>
  );
}
