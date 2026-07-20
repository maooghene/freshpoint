"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Sun,
  Moon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOut,
} from "lucide-react";
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";
import { NavigationItemShape, BusinessInfo } from "./types";

interface DesktopSidebarProps {
  businessInfo: BusinessInfo | null;
  isApproved: boolean;
  navigationItems: NavigationItemShape[];
  checkActive: (item: NavigationItemShape) => boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  user:

    | { firstName?: string | null; lastName?: string | null }
    | null
    | undefined;
}

export default function DesktopSidebar({
  businessInfo,
  isApproved,
  navigationItems,
  checkActive,
  theme,
  setTheme,
  user,
}: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [hasMounted] = React.useState(() => typeof window !== "undefined");

  const resolvedTheme = theme ?? "light";

  return (
    <aside
      className={`hidden lg:flex h-full shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* 1. Header Block - Cleaned up to keep the logo layout completely sleek and streamlined */}
      <div className="flex flex-col gap-2 border-b border-border p-4 pb-3 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0 w-full justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center lg:justify-start">
            {isCollapsed ? (
              <FreshpointLogo size={24} />
            ) : (
              <div className="min-w-0 flex-1 flex flex-col animate-in fade-in duration-200 gap-1.5">
                <FreshpointLogo size={24} />
                {/* Fixed the business name text to a sleek, professional micro-typography scale */}
                <span className="truncate text-[10px] font-bold text-muted-foreground tracking-wide uppercase leading-none mt-0.5">
                  {businessInfo?.name || "FreshpointBiz"}
                </span>
              </div>
            )}
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 pl-0 min-w-0 animate-in fade-in duration-200 mt-1">
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide select-none ${
                isApproved
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isApproved ? "✓ Approved" : "● Pending"}
            </span>
          </div>
        )}
      </div>

      {/* 2. Scrollable Navigation List */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = checkActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 ${isCollapsed ? "justify-center px-0 w-10 mx-auto" : "px-3.5"} rounded-xl py-2.5 text-sm font-bold transition-all ${
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

      {/* 3. ULTRA-COMPACT WORKSPACE FOOTER */}
      <div className="flex flex-col gap-2 border-t border-border p-3 shrink-0 min-w-0 bg-card">
        {/* ROW 1: System Toggles & Exit Action */}
        <div
          className={`flex items-center gap-2 w-full ${isCollapsed ? "flex-col justify-center" : "flex-row justify-between"}`}
        >
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground bg-secondary/10"
            title={
              resolvedTheme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
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

          {/* SIDE-BY-SIDE EXIT WORKSPACE */}
          <Link
            href="/"
            title="Exit Workspace"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              window.location.href = "/";
            }}
            className={`group inline-flex h-8 items-center justify-center rounded-lg border border-transparent transition-all duration-200 bg-secondary/30 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 ${
              isCollapsed
                ? "w-8"
                : "flex-1 gap-1.5 px-2.5 text-[11px] font-bold"
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span className="truncate">Exit</span>}
          </Link>

          {/* Sidebar Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground bg-secondary/10"
            title={isCollapsed ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 shrink-0" />
            )}
          </button>
        </div>

        {/* ROW 2: Compact User Identity Profile Card */}
        <div
          className={`flex items-center gap-2.5 min-w-0 border-t border-border/40 pt-2 ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="shrink-0 scale-90 flex items-center justify-center">
            <UserButton />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col flex-1 leading-none animate-in fade-in duration-200">
              <span className="truncate text-xs font-bold text-foreground">
                {user?.firstName || "Store"}
              </span>
              <span className="truncate text-[9px] text-muted-foreground font-medium mt-0.5">
                Business Owner
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
