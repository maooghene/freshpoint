"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  CalendarDays,
  Sun,
  Moon,
  LogIn,
  MapPin,
  ClipboardList,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";

interface MobileDrawerProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleMobileSearch: (e: React.FormEvent) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  isSignedIn: boolean | undefined;
  cartItemsCount: number;
  hasBusinessAccess: boolean;
  merchantDashboardHref: string | null;
  closeMenu: () => void;
}

export function MobileDrawer({
  searchQuery,
  setSearchQuery,
  handleMobileSearch,
  theme,
  setTheme,
  isSignedIn,
  cartItemsCount,
  hasBusinessAccess,
  merchantDashboardHref,
  closeMenu,
}: MobileDrawerProps) {
  return (
    <div className="md:hidden fixed inset-0 top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background/98 backdrop-blur-md z-40 flex flex-col p-6 animate-fadeIn transition-all border-t border-border">
      <div className="w-full max-w-sm mx-auto space-y-6 pt-4">
        <form
          onSubmit={handleMobileSearch}
          className="flex items-center gap-3 bg-muted/80 border border-border rounded-xl px-4 py-3.5 focus-within:border-primary w-full"
        >
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search spas, treatments, salons..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </form>

        <div className="grid grid-cols-3 gap-y-6 gap-x-4 border border-border bg-card/60 p-5 rounded-2xl shadow-sm justify-items-center">
          <Link
            href="/explore"
            onClick={closeMenu}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <div className="p-2 bg-muted rounded-xl mb-1">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center">
              Browse
            </span>
          </Link>

          <Link
            href="/orders/history"
            onClick={closeMenu}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <div className="p-2 bg-muted rounded-xl mb-1">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center">
              Track
            </span>
          </Link>

          <Link
            href="/cart"
            onClick={closeMenu}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors relative"
          >
            <div className="p-2 bg-muted rounded-xl mb-1">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-background">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center">
              Cart
            </span>
          </Link>

          <Link
            href="/appointments/history"
            onClick={closeMenu}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <div className="p-2 bg-muted rounded-xl mb-1">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center">
              Bookings
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              closeMenu();
            }}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary border-none bg-transparent outline-none cursor-pointer"
          >
            <div className="p-2 bg-muted rounded-xl mb-1">
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center whitespace-nowrap">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>

          <div className="flex flex-col items-center justify-center">
            <div className="p-1 mb-1">
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox:
                        "w-8 h-8 rounded-xl border border-border shadow-sm",
                    },
                  }}
                />
              ) : (
                <SignInButton mode="modal">
                  <button className="p-2 bg-primary/10 text-primary rounded-xl cursor-pointer">
                    <LogIn className="w-5 h-5" />
                  </button>
                </SignInButton>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center">
              {isSignedIn ? "Profile" : "Login"}
            </span>
          </div>
        </div>

        {hasBusinessAccess && (
          <Button
            asChild
            disabled={!merchantDashboardHref}
            className="w-full py-6 rounded-xl font-black text-sm shadow-md disabled:opacity-60 mt-2"
            onClick={closeMenu}
          >
            <Link href={merchantDashboardHref || "#"}>
              {!merchantDashboardHref
                ? "Loading Workspace..."
                : merchantDashboardHref.startsWith("/admin")
                  ? "Admin Panel"
                  : "My Shop"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
