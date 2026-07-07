"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/store";
import { useUser } from "@clerk/nextjs";
import { DesktopActions } from "./DesktopActions";
import { MobileDrawer } from "./MobileDrawer";
import { UserAuthButton } from "./UserAuthButton";

interface NavbarActionsProps {
  isCurrentlyInBusinessDashboard: boolean;
  businessId: string;
  hasBusinessAccess: boolean;
  merchantDashboardHref: string;
}

export function NavbarActions({
  isCurrentlyInBusinessDashboard,
  businessId,
  hasBusinessAccess,
  merchantDashboardHref,
}: NavbarActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>(
    searchParams?.get("search") || "",
  );

  const { isSignedIn } = useUser();
  const cartItemsCount = useAppSelector((state) => state.cart.items.length);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handler);
  }, []);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMobileOpen(false);
    router.push(
      searchQuery.trim()
        ? `/explore?search=${encodeURIComponent(searchQuery.trim())}`
        : "/explore",
    );
  };

  return (
    <div className="flex flex-1 items-center justify-end md:justify-between w-full h-full">
      {/* 1. Desktop Stacks Injection */}
      <DesktopActions
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleDesktopSearch={handleMobileSearch} // Reuses your proven working router logic function!
        theme={theme}
        setTheme={setTheme}
        mounted={mounted}
        cartItemsCount={cartItemsCount}
      />

      {/* Business Portal Link Sockets */}
      {hasBusinessAccess && !isCurrentlyInBusinessDashboard && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="hidden lg:flex rounded-xl font-bold text-xs bg-card border-border shadow-2xs"
        >
          <Link href={merchantDashboardHref}>Biz Dashboard</Link>
        </Button>
      )}

      {/* 2. Clerk Auth Token Trigger */}
      <UserAuthButton isSignedIn={isSignedIn} />

      {/* 3. Responsive Hamburger Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 cursor-pointer z-50 relative animate-fadeIn"
        aria-label="Toggle navigation overlay drawer"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 4. Full Viewport Mobile Drawer Modal Injection */}
      {isMobileOpen && (
        <MobileDrawer
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleMobileSearch={handleMobileSearch}
          theme={theme}
          setTheme={setTheme}
          isSignedIn={isSignedIn}
          cartItemsCount={cartItemsCount}
          hasBusinessAccess={hasBusinessAccess}
          merchantDashboardHref={merchantDashboardHref}
          closeMenu={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
