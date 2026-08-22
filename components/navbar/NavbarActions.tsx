// components/navbar/NavbarActions.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/store";
import { useUser } from "@clerk/nextjs";
import { DesktopActions } from "./DesktopActions";
import { MobileDrawer } from "./MobileDrawer";
import { UserAuthButton } from "./UserAuthButton";
import { useNavbarRouting } from "./useNavbarRouting";

interface NavbarActionsProps {
  isCurrentlyInBusinessDashboard: boolean;
  businessId: string;
  hasBusinessAccess: boolean;
  merchantDashboardHref: string | null;
  portalLabel?: string;
}

export function NavbarActions({
  isCurrentlyInBusinessDashboard,
  businessId,
  hasBusinessAccess,
  merchantDashboardHref,
  portalLabel: passedPortalLabel,
}: NavbarActionsProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const [isMobileOpen, setIsMobileOpen] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>(
    searchParams?.get("search") || "",
  );

  const { isSignedIn } = useUser();
  const cartItemsCount = useAppSelector((state) => state.cart.items.length);

  const {
    handlePortalNavigation,
    isNavigating,
    portalLabel: hookPortalLabel,
  } = useNavbarRouting();

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handler);
  }, []);

  const handleMobileSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setIsMobileOpen(false);
    router.push(
      searchQuery.trim()
        ? `/explore?search=${encodeURIComponent(searchQuery.trim())}`
        : "/explore",
    );
  };

  const displayLabel = isNavigating
    ? "Verifying Space..."
    : passedPortalLabel || hookPortalLabel || "Manage Spaces";

  return (
    <div className="flex flex-1 items-center justify-end lg:justify-between w-full h-full min-w-0">
      {/* 1. Desktop Actions Integration */}
      <DesktopActions
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleDesktopSearch={handleMobileSearch}
        theme={theme}
        setTheme={setTheme}
        mounted={mounted}
        cartItemsCount={cartItemsCount}
        hasBusinessAccess={hasBusinessAccess}
        displayLabel={displayLabel}
        handlePortalNavigation={handlePortalNavigation}
        isNavigating={isNavigating}
        isSignedIn={isSignedIn}
      />

      {/* Business / Admin Portal Button Socket (Renders on full screens) */}
      {hasBusinessAccess && merchantDashboardHref && (
        <div className="hidden lg:flex items-center gap-2 min-w-0 ml-5 mr-3 shrink-0 select-none">
          <div className="relative flex h-1.5 w-1.5 shrink-0 select-none">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>

          <Button
            onClick={handlePortalNavigation}
            disabled={isNavigating}
            variant="outline"
            className="relative overflow-hidden group h-8.5 rounded-xl border border-zinc-200/80 bg-white/70 backdrop-blur-md px-3.5 text-[11px] font-bold text-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-emerald-600 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5 active:translate-y-0 dark:border-zinc-200/80 dark:bg-zinc-950/70 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-emerald-400 dark:hover:border-emerald-500/40 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>

              <span className="tracking-wide">{displayLabel}</span>
            </div>
          </Button>
        </div>
      )}

      {/* 2. Clerk Auth Button Trigger */}
      <div className="shrink-0">
        <UserAuthButton isSignedIn={isSignedIn} />
      </div>

      {/* 3. Hamburger Mobile Trigger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 cursor-pointer z-50 relative shrink-0 ml-2"
        aria-label="Toggle navigation overlay drawer"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* 4. Mobile Drawer Modal Injection */}
      {isMobileOpen && (
        <MobileDrawer
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleMobileSearch={handleMobileSearch}
          theme={theme}
          setTheme={setTheme}
          isSignedIn={isSignedIn}
          cartItemsCount={cartItemsCount}
          // 🌟 PASS PARAMETERS SECURELY DOWN TO MOBILE OVERLAY
          hasBusinessAccess={hasBusinessAccess}
          displayLabel={displayLabel}
          handlePortalNavigation={handlePortalNavigation}
          isNavigating={isNavigating}
          closeMenu={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
