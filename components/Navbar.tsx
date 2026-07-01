"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/store";
import { setBookingCount } from "@/lib/features/bookingSlice";
import { Button } from "./ui/button";
import {
  BookAlertIcon,
  Sparkles,
  Search,
  MapPin,
  ShoppingCart,
  Sun,
  Moon,
  LayoutDashboard,
  Store,
  Users,
} from "lucide-react";

function NavbarContent() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || "",
  );

  const [userRole, setUserRole] = useState<string>("CUSTOMER");

  const totalQuantity =
    useAppSelector((state) => state.cart?.totalQuantity) || 0;
  const bookingCount =
    useAppSelector((state) => state.booking?.upcomingCount) || 0;

  useEffect(() => {
    if (!user) {
      setUserRole("CUSTOMER");
      return;
    }

    const syncLiveCountsAndRole = async () => {
      try {
        const res = await fetch("/api/navigation/counts");
        if (res.ok) {
          const data = await res.json();
          dispatch(setBookingCount(data.bookingCount || 0));
          setUserRole(data.role || "CUSTOMER");
        }
      } catch (err) {
        console.error("Layout metric initialization failure:", err);
      }
    };

    syncLiveCountsAndRole();
  }, [user, dispatch]);

  const isLandingPage = pathname === "/";
  const showAppNavbar = user && !isLandingPage;

  // 1️⃣ CRITICAL FIX: Base your layout directly on the URL path instead of the user profile role!
  const isCurrentlyInBusinessDashboard = pathname.startsWith("/business");
  const hasBusinessAccess =
    userRole === "BUSINESS_OWNER" || userRole === "STAFF";

  // Safely grab the tenant business ID parameter from URLs like "/business/clw123abc/..."
  const pathSegments = pathname.split("/");
  const businessId = pathSegments[1] === "business" ? pathSegments[2] : "";

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-6 border-b border-border bg-background h-16 flex items-center">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
        {/* LOGO */}
        <Link
          href={
            isCurrentlyInBusinessDashboard && businessId
              ? `/business/${businessId}`
              : "/"
          }
          className="flex items-center gap-2 text-primary font-sans font-bold text-2xl tracking-tight"
        >
          <Sparkles className="size-6 text-primary" />
          <span>
            Freshpoint
            {isCurrentlyInBusinessDashboard && (
              <span className="text-xs ml-1 px-1.5 py-0.5 bg-primary/10 rounded text-muted-foreground font-mono">
                Biz
              </span>
            )}
          </span>
        </Link>

        {/* ================= 1. LANDING/PUBLIC NAV ================= */}
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
        ) : isCurrentlyInBusinessDashboard && businessId ? (
          /* ================= 2. ACTIVE BUSINESS OWNER MANAGEMENT VIEWS ================= */
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link
              href={`/business/${businessId}`}
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathSegments.length === 3
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard size={16} />
              Overview
            </Link>
            <Link
              // 🛠️ FIX 1: Uses your exact local variable name (businessId or businessSlug) inside the string template text
              href={`/business/${businessId}/add-service`}
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                // 🛠️ FIX 2: Correctly checks your true browser path location to highlight the link text cleanly
                pathname.includes("/add-service")
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store size={16} />
              Services & Products
            </Link>

            <Link
              href={`/business/${businessId}/staff`}
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname.includes("/staff")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={16} />
              Staff
            </Link>
          </div>
        ) : (
          /* ================= 3. REGULAR CUSTOMER & SHOPPING MARKETPLACE VIEW ================= */
          /* (This renders for both regular customers and business owners who are out shopping!) */
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
              {!isCurrentlyInBusinessDashboard ? (
                <>
                  {/* SHOPPING MODE ACTIONS (VISIBLE TO EVERYONE OUTSIDE THE /BUSINESS ROUTE) */}
                  <Link
                    href="/cart"
                    className="relative text-muted-foreground hover:text-primary transition-colors p-1 flex items-center justify-center"
                  >
                    <ShoppingCart size={24} />
                    {totalQuantity > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {totalQuantity}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/bookings"
                    className="relative text-muted-foreground hover:text-primary transition-colors p-1 flex items-center justify-center"
                  >
                    <BookAlertIcon size={24} />
                    {bookingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {bookingCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                /* MANAGEMENT MODE ACTIONS (ONLY APPLIES INSIDE THE /BUSINESS WORKSPACE PATHS) */
                <Link
                  href={`/business/${businessId}/bookings`}
                  className="relative text-muted-foreground hover:text-primary transition-colors p-1 flex items-center justify-center"
                >
                  <BookAlertIcon size={24} />
                  {bookingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {bookingCount}
                    </span>
                  )}
                </Link>
              )}

              {/* DUAL CONTEXT SWITCHER INTEGRATED STRAIGHT INTO CLERK USER MENU */}
              <UserButton>
                {hasBusinessAccess && (
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label={
                        isCurrentlyInBusinessDashboard
                          ? "Switch to Shopping Mode"
                          : "Switch to Store Dashboard"
                      }
                      labelIcon={<Store size={16} />}
                      href={
                        isCurrentlyInBusinessDashboard
                          ? "/"
                          : "/business/dashboard-lookup-route"
                      }
                    />
                  </UserButton.MenuItems>
                )}
              </UserButton>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="fixed top-0 right-0 left-0 z-50 px-6 border-b border-border bg-background h-16 flex items-center">
          <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Sparkles className="size-6 text-primary" />
              <span>Freshpoint</span>
            </div>
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
