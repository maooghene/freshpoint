// components/business/staff/sidebar/StaffSidebarFooter.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LogOut, Sun, Moon } from "lucide-react";

interface StaffSidebarFooterProps {
  user: { firstName?: string | null } | null | undefined;
}

export default function StaffSidebarFooter({ user }: StaffSidebarFooterProps) {
  const [toggleTrigger, setToggleTrigger] = React.useState<boolean>(false);

  const toggleThemeMode = () => {
    if (typeof window === "undefined") return;

    const rootElement = document.documentElement;
    if (rootElement.classList.contains("dark")) {
      rootElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      rootElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setToggleTrigger((prev) => !prev);
  };

  // 🎯 THE FIX: Locks down session persistence to block automatic onboarding snap-backs
  const handleExitWorkspace = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("freshpoint_exit_clearance", "true");
    }
    window.location.href = "/";
  };

  return (
    /* Clean layout metrics with explicit micro-padding variations to avoid text clipping inside slim phone drawers */
    <div className="mt-auto border-t border-border p-3 sm:p-4 bg-card shrink-0 flex flex-col gap-3 min-w-0 w-full">
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <Link
          href="/"
          onClick={handleExitWorkspace}
          className="flex-1 inline-flex shrink-0 items-center gap-1.5 h-8 rounded-full pl-1.5 pr-2 sm:pl-2 sm:pr-3 bg-secondary/40 text-[10px] sm:text-[11px] font-bold text-foreground/90 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-95 group select-none min-w-0"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-all duration-200">
            <LogOut className="h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </span>
          <span className="tracking-tight truncate">{"Exit Workspace"}</span>
        </Link>

        <button
          onClick={toggleThemeMode}
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/40 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground active:scale-90"
          aria-label="Toggle structural workspace illumination theme"
        >
          <span className="dark:hidden block">
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/80" />
          </span>
          <span className="hidden dark:block">
            <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border/50 min-w-0 w-full">
        <div className="shrink-0 flex items-center">
          <UserButton />
        </div>
        <div className="flex min-w-0 flex-col flex-1">
          <span className="truncate text-xs font-bold text-foreground">
            {user?.firstName || "Team Member"}
          </span>
          <span className="truncate text-[10px] text-muted-foreground font-medium">
            {"Staff Workspace"}
          </span>
        </div>
      </div>
    </div>
  );
}
