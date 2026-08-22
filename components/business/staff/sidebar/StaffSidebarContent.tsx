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
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";

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
        <div className="flex flex-col min-w-0 items-start gap-2">
          {/* Sized perfectly to remain proportional across both mobile and tablet widths */}
          <FreshpointLogo size={35} />
          <div className="flex flex-col min-w-0 mt-1">
            <span className="truncate font-black text-xs text-foreground tracking-wide uppercase max-w-[40vw] sm:max-w-[180px]">
              {businessName}
            </span>
            <span className="font-semibold text-[10px] text-muted-foreground tracking-wider uppercase">
              Staff Portal
            </span>
          </div>
        </div>
        <button
          onClick={onCloseMobileMenu}
          className="flex lg:hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors mt-0.5"
          aria-label="Close menu"
        >
          <X className="h-3.5 w-3.5" />
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
