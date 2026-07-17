"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  XIcon,
  Sun,
  Moon,
  ChevronLeftIcon,
  ArrowRightIcon,
} from "lucide-react";
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";
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
      {/* Sidebar Mobile Drawer Container */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-2xl transition-transform duration-300 ease-in-out border-r border-border flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header Area */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0 min-w-0 gap-2">
          <div className="flex min-w-0 items-center gap-2 flex-1">
            <div className="flex min-w-0 flex-col gap-0.5 flex-1">
              <FreshpointLogo size={30} />
              <span className="truncate text-xs font-semibold text-muted-foreground">
                {businessInfo?.name || "FreshPoint"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="shrink-0 rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close navigation panel"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Action Link Streams */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
          {navigationItems.map((item) => {
            const isActive = checkActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utilities Footer Row Layout Area */}
        <div className="border-t border-border p-4 bg-card shrink-0 flex flex-col gap-3 min-w-0">
          <div className="flex flex-row items-center justify-between gap-2 w-full">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground bg-secondary/20"
              aria-label="Toggle dark mode layout"
            >
              {hasMounted ? (
                isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <span className="h-5 w-5 rounded-full bg-muted/50" />
              )}
            </button>

            {/* 💡 MOVED LINK: Exit Workspace shifted into the same horizontal panel row on mobile viewports */}
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                window.location.href = "/";
              }}
              className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground bg-secondary/20 px-3 text-xs font-bold"
              aria-label="Exit current workspace and browse providers"
            >
              <ArrowRightIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">Exit Workspace</span>
            </Link>
          </div>

          {/* User Account Bar */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/50 min-w-0">
            <UserButton />
            <div className="flex min-w-0 flex-col flex-1">
              <span className="truncate text-xs font-bold text-foreground">
                {user?.firstName || "Store"}
              </span>
              {/* 💡 RESTORED KEY TEXT IDENTIFIER: Keeps "Business Owner" tracking locked down across all devices */}
              <span className="truncate text-[10px] text-muted-foreground">
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
