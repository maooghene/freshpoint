// components/business/staff/sidebar/StaffSidebarContent.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  SparklesIcon,
  LayoutDashboard,
  CalendarCheck2,
  PackageSearch,
  CalendarClock,
  Settings,
  X,
} from "lucide-react";
import StaffNavItem from "./StaffNavItem";
import StaffSidebarFooter from "./StaffSidebarFooter";

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
      <div className="flex h-16 items-center border-b border-border px-6 min-w-0 justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <SparklesIcon className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate font-black text-sm text-foreground tracking-wide uppercase">
            {businessName} {"Staff"}
          </span>
        </div>
        <button
          onClick={onCloseMobileMenu}
          className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
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
