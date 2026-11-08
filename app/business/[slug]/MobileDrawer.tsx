"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { XIcon, Sun, Moon, ArrowRightIcon } from "lucide-react";
import { DashboardBrand } from "@/components/dashboard/DashboardBrand";
import { NavigationItemShape, BusinessInfo } from "./types";

interface MobileDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  businessInfo: BusinessInfo | null;
  navigationItems: NavigationItemShape[];
  checkActive: (item: NavigationItemShape) => boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  user: { firstName?: string | null } | null | undefined;
}

export default function MobileDrawer({
  isOpen,
  setIsOpen,
  businessInfo,
  navigationItems,
  checkActive,
  theme,
  setTheme,
  user,
}: MobileDrawerProps) {
  const [hasMounted] = React.useState(() => typeof window !== "undefined");

  const isDark = (theme ?? "light") === "dark";

  return (
    <>
      {/* Sidebar Mobile Drawer Container - Fixed to a clean, ultra-slim responsive layout width matching the staff drawer specs */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 h-dvh w-[85vw] max-w-xs pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transform bg-card shadow-2xl transition-transform duration-300 ease-in-out border-r border-border flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header Area */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4 shrink-0 min-w-0 gap-2">
          <DashboardBrand subtitle={businessInfo?.name || "FreshPoint"} />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close navigation panel"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Action Link Streams */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 custom-scrollbar">
          {navigationItems.map((item) => {
            const isActive = checkActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utilities Footer Row Layout Area */}
        <div className="border-t border-border p-3 sm:p-4 bg-card shrink-0 flex flex-col gap-3 min-w-0">
          <div className="flex flex-row items-center justify-between gap-2 w-full">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground bg-secondary/20"
              aria-label="Toggle dark mode layout"
            >
              {hasMounted ? (
                isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )
              ) : (
                <span className="h-4 w-4 rounded-full bg-muted/50" />
              )}
            </button>

            {/* Exit Workspace Link */}
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                window.location.href = "/";
              }}
              className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground bg-secondary/20 px-2 text-[10px] sm:text-xs font-bold min-w-0"
              aria-label="Exit current workspace and browse providers"
            >
              <ArrowRightIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">Exit</span>
            </Link>
          </div>

          {/* User Account Bar */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/50 min-w-0">
            <UserButton />
            <div className="flex min-w-0 flex-col flex-1">
              <span className="truncate text-xs font-bold text-foreground">
                {user?.firstName || "Store"}
              </span>
              <span className="truncate text-[10px] text-muted-foreground font-medium">
                Business Owner
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop Shield Trigger */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}
    </>
  );
}
