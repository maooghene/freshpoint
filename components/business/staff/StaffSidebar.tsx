// components/business/staff/StaffSidebar.tsx
"use client";

import * as React from "react";
import { SparklesIcon, Menu } from "lucide-react";
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
      {/* Mobile Floating Header Bar */}
      <header className="flex lg:hidden fixed top-0 left-0 right-0 z-30 h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <span className="font-black text-xs text-foreground tracking-wide uppercase truncate max-w-[180px]">
            {businessName}
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/40 text-foreground hover:bg-secondary"
          aria-label="Open workforce menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop Sidebar View Container Context */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-border">
        <StaffSidebarContent
          businessName={businessName}
          user={user}
          onCloseMobileMenu={closeMobileMenu}
        />
      </aside>

      {/* Mobile Backdrop Overlay Drawer Mask */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />
      )}

      {/* Mobile Sliding Navigation Drawer Panel Element */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border shadow-2xl transition-transform duration-300 ease-in-out ${
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
