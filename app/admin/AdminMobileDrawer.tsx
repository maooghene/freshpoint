
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Users } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Store,
  AlertCircle,
  Settings2,
  ShieldAlert,
  XIcon,
  LogOut,
  Sun,
  Moon,
  Tag,
  Megaphone,
  ScrollText,
} from "lucide-react";
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";

// Matches your master sidebar layout items with simple English labels
const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Vendor Verification", href: "/admin/businesses", icon: Store },
  { name: "Customers", href: "/admin/users", icon: Users },
  { name: "Categories", href: "/admin/categories", icon: Tag },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Complaints", href: "/admin/complaints", icon: AlertCircle },
  { name: "Global Settings", href: "/admin/settings", icon: Settings2 },
  { name: "Admin Staff", href: "/admin/staff", icon: ShieldAlert },
  { name: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
];

interface AdminMobileDrawerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function AdminMobileDrawer({
  isOpen,
  setIsOpen,
}: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [hasMounted] = React.useState(() => typeof window !== "undefined");

  const resolvedTheme = theme ?? "light";

  const checkActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-border bg-card transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0 flex flex-col gap-1">
              <FreshpointLogo size={35} />
              <span className="truncate text-[10px] text-muted-foreground leading-none">
                Main Office Hub
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl border border-border bg-secondary/50 text-foreground shrink-0 cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = checkActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3 shrink-0 bg-card">
          <div className="flex items-center gap-2 w-full justify-between">
            <button
              type="button"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground bg-secondary/10 bg-transparent cursor-pointer"
              title={
                resolvedTheme === "dark"
                  ? "Turn on Light Mode"
                  : "Turn on Dark Mode"
              }
            >
              {hasMounted ? (
                resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )
              ) : (
                <span className="h-4 w-4 rounded-full bg-muted/50" />
              )}
            </button>

            <Link
              href="/"
              className="group inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-secondary/30 px-2.5 text-[11px] font-bold text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20"
              title="Leave Admin App"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Leave</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 min-w-0 border-t border-border/40 pt-2">
            <div className="shrink-0 scale-90 flex items-center justify-center">
              <UserButton />
            </div>
            <div className="flex min-w-0 flex-col flex-1 leading-none">
              <span className="truncate text-xs font-bold text-foreground">
                Manager Account
              </span>
              <span className="truncate text-[9px] text-muted-foreground font-medium mt-0.5">
                App Operator
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
