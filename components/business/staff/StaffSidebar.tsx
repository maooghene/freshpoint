// components/business/staff/StaffSidebar.tsx
"use client";

import * as React from "react";
import { MobileTopBar } from "@/components/dashboard/MobileTopBar";
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
      <MobileTopBar
        className="fixed left-0 right-0 top-0"
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        subtitle={`Staff · ${businessName}`}
        menuLabel="Open workforce menu"
      />

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

      {/* Mobile & Medium Viewport Sliding Navigation Drawer Panel Element */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 h-dvh w-[85vw] max-w-xs pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transform border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out ${
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
