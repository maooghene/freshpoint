// components/admin/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  AlertCircle,
  Settings2,
  ShieldAlert,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard Overview", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Check New Stores", icon: Store },
  { href: "/admin/complaints", label: "User Complaints", icon: AlertCircle },
  { href: "/admin/settings", label: "App Settings", icon: Settings2 },
  { href: "/admin/staff", label: "Admin Staff", icon: ShieldAlert },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-3 text-sm font-medium space-y-1 py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
