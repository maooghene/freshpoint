// components/business/staff/sidebar/StaffSidebarContent.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  PackageSearch,
  CalendarClock,
  Settings,
  X,
} from "lucide-react";
import StaffNavItem from "./StaffNavItem";
import StaffSidebarFooter from "./StaffSidebarFooter";
import { DashboardBrand } from "@/components/dashboard/DashboardBrand";

interface StaffSidebarContentProps {
  businessName: string;
  user: { firstName?: string | null } | null | undefined;
  onCloseMobileMenu: () => void;
}

export default function StaffSidebarContent({
  businessName,
  user,
  onCloseMobileMenu,
}: StaffSidebarContentProps) {
  const pathname = usePathname() || "";

  const staffNavItems = [
    { name: "Overview", href: "/staff/dashboard", icon: LayoutDashboard },
    { name: "My Bookings", href: "/staff/bookings", icon: CalendarCheck2 },
    { name: "Store Orders", href: "/staff/orders", icon: PackageSearch },
    { name: "My Schedule", href: "/staff/schedule", icon: CalendarClock },
    { name: "Settings", href: "/staff/settings", icon: Settings },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-card font-sans">
      {/* Branding Block - Vertical layout with adaptive padding scales for slim mobile viewports */}
      <div className="flex h-auto min-h-[5rem] py-5 items-start border-b border-border px-3 sm:px-6 min-w-0 justify-between">
        <DashboardBrand subtitle={businessName} caption="Staff Portal" />
        <button
          onClick={onCloseMobileMenu}
          className="flex lg:hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
        {staffNavItems.map((item) => (
          <StaffNavItem
            key={item.name}
            name={item.name}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href}
            onItemClick={onCloseMobileMenu}
          />
        ))}
      </nav>

      <StaffSidebarFooter user={user} />
    </div>
  );
}
