"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAppSelector } from "@/lib/store"; // FIXED: Uses type-safe custom hook from central store
import { Button } from "./ui/button";
import {
  BookAlertIcon,
  Sparkles,
  Search,
  MapPin,
  ShoppingCart,
  Sun,
  Moon,
} from "lucide-react";

function Navbar() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || "",
  );

  // FIXED: No longer uses plain useSelector with broken RootState imports
  const { totalQuantity } = useAppSelector((state) => state.cart);

  const isLandingPage = pathname === "/";
  const showAppNavbar = user && !isLandingPage;

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-6 border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 text-primary font-sans font-bold text-2xl tracking-tight"
        >
          <Sparkles className="size-6 text-primary" />
          <span>Freshpoint</span>
        </Link>

        {/* ================= LANDING NAV ================= */}
        {!showAppNavbar ? (
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it Works
            </a>
            <a
              href="#for-owners"
              className="hover:text-foreground transition-colors"
            >
              For Providers
            </a>
          </div>
        ) : (
          /* ================= APP NAV (WELLNESS SEARCH & BROWSE) ================= */
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(
                    `/explore?search=${encodeURIComponent(searchQuery)}`,
                  );
                } else {
                  router.push("/explore");
                }
              }}
              className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 border border-border/50 focus-within:border-primary/50 transition-all max-w-sm w-full"
            >
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search spas, salons, treatments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </form>

            <Link
              href="/explore"
              className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <MapPin size={16} />
              Browse all
            </Link>
          </div>
        )}

        {/* ================= ACTIONS + AUTH CLUSTER ================= */}
        <div className="flex items-center gap-4">
          {/* THEME TOGGLE SWITCH - FIXED: Uses pure Tailwind mode selectors to prevent hydration loops */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            <Sun size={20} className="hidden dark:block" />
            <Moon size={20} className="block dark:hidden" />
          </button>

          {!user ? (
            <SignInButton mode="modal">
              <Button size="sm" className="font-semibold rounded-lg">
                Get started
              </Button>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-4">
              {/* 🛒 MULTI-TENANT BASKET STATUS */}
              <Link
                href="/cart"
                className="relative text-muted-foreground hover:text-primary transition-colors"
              >
                <ShoppingCart size={24} />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-in scale-in">
                    {totalQuantity}
                  </span>
                )}
              </Link>

              {/* 📅 LIVE APPOINTMENT ENTRIES */}
              <Link
                href="/bookings"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <BookAlertIcon size={24} />
              </Link>

              {/* USER ACTION INTERFACE */}
              <UserButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
