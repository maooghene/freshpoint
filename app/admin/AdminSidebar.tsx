// components/admin/sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Store,
  AlertCircle,
  Settings2,
  ShieldAlert,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

// Keeping your exact routes and data structures intact, only simplifying the text strings
const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Check New Stores", href: "/admin/businesses", icon: Store },
  { name: "User Complaints", href: "/admin/complaints", icon: AlertCircle },
  { name: "App Settings", href: "/admin/settings", icon: Settings2 },
  { name: "Admin Staff", href: "/admin/staff", icon: ShieldAlert },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [hasMounted] = React.useState(() => typeof window !== "undefined");

  const resolvedTheme = theme ?? "light";

  const checkActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <aside
      className={`hidden lg:flex h-full shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border p-4 pb-3 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0 w-full justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center lg:justify-start">
            <SparklesIcon className="w-5 h-5 shrink-0 text-primary" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1 flex flex-col animate-in fade-in duration-200">
                <span className="truncate bg-linear-to-r from-primary to-primary/60 bg-clip-text font-black text-lg text-transparent">
                  FreshPoint Admin
                </span>
                <span className="truncate text-[10px] text-muted-foreground leading-none mt-0.5">
                  Main Office Hub
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = checkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 ${
                isCollapsed ? "justify-center px-0 w-10 mx-auto" : "px-3.5"
              } rounded-xl py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="truncate animate-in fade-in duration-200 text-xs">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-border p-3 shrink-0 min-w-0 bg-card">
        <div
          className={`flex items-center gap-2 w-full ${
            isCollapsed ? "flex-col justify-center" : "flex-row justify-between"
          }`}
        >
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground bg-secondary/10 bg-transparent"
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

          {/* Exit Button */}
          <Link
            href="/"
            title="Leave Admin App"
            className={`group inline-flex h-8 items-center justify-center rounded-lg border border-transparent transition-all duration-200 bg-secondary/30 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 ${
              isCollapsed
                ? "w-8"
                : "flex-1 gap-1.5 px-2.5 text-[11px] font-bold"
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span className="truncate">Leave</span>}
          </Link>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground bg-secondary/10 bg-transparent"
            title={isCollapsed ? "Make Menu Bigger" : "Make Menu Smaller"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 shrink-0" />
            )}
          </button>
        </div>

        {/* User Button Info */}
        <div
          className={`flex items-center gap-2.5 min-w-0 border-t border-border/40 pt-2 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="shrink-0 scale-90 flex items-center justify-center">
            <UserButton />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col flex-1 leading-none animate-in fade-in duration-200">
              <span className="truncate text-xs font-bold text-foreground">
                Manager Account
              </span>
              <span className="truncate text-[9px] text-muted-foreground font-medium mt-0.5">
                App Operator
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
