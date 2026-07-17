"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface NavigationCountsResponse {
  role?: string;
}

interface OnboardingResponse {
  destination?: string;
}

export function useNavbarRouting() {
  const { user } = useUser();
  const pathname = usePathname() || "";

  // 1️⃣ DERIVED LIFECYCLE INITIALIZER: Synchronously handle reset states
  // right inside the render phase without causing hook dependency loop crashes
  const [serverRole, setServerRole] = useState<string>("CUSTOMER");
  const [merchantDashboardHref, setMerchantDashboardHref] = useState<
    string | null
  >(null);

  // Track dynamic path evaluation markers directly from browser URL
  const pathSegments = useMemo<string[]>(() => {
    return pathname.split("/").filter(Boolean);
  }, [pathname]);

  const isCurrentlyInBusinessDashboard = pathname.startsWith("/business");

  const businessId = useMemo<string>(() => {
    return isCurrentlyInBusinessDashboard && pathSegments.length > 1
      ? pathSegments[1]
      : "";
  }, [isCurrentlyInBusinessDashboard, pathSegments]);

  // Derived user authentication tracking parameter
  const userRole = user ? serverRole : "CUSTOMER";

  useEffect(() => {
    // 2️⃣ CLEAN BAILOUT TRIGGER: Pure early exit pattern.
    // No more calling setState() directly inside the structural boundary check block!
    if (!user) return;

    // AbortController to eliminate mid-air network unmount failures
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchIdentityContext = async (): Promise<void> => {
      try {
        const res = await fetch("/api/navigation/counts", { signal });
        if (res.ok) {
          const data = (await res.json()) as NavigationCountsResponse;
          setServerRole(data.role || "CUSTOMER");
        }

        const onboardRes = await fetch("/api/auth/check-onboarding", {
          signal,
        });
        if (onboardRes.ok) {
          const onboardData = (await onboardRes.json()) as OnboardingResponse;

          if (onboardData.destination) {
            const dest = onboardData.destination;

            // Only mount the path href pointer if the background onboarding worker
            // successfully resolves a live active portal route context!
            if (
              dest.startsWith("/business") ||
              dest.startsWith("/staff") ||
              dest.startsWith("/admin")
            ) {
              setMerchantDashboardHref(dest);
            } else {
              setMerchantDashboardHref(null);
            }
          }
        }
      } catch (err: unknown) {
        // Only log errors if the network fetch wasn't deliberately cancelled by an unmount signal
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(
            "Failed to initialize structural navigation states:",
            err,
          );
        }
      }
    };

    void fetchIdentityContext();

    // Cleanup function runs instantly on unmount or user shift to cancel flying HTTP slots
    return () => {
      controller.abort();
    };
  }, [user]);

  // 3️⃣ INLINE RESET GATEWAY: Instantly strips active links if a user signs out
  // directly in the render phase, guaranteeing zero state lag or linter warnings
  const effectiveDashboardHref = user ? merchantDashboardHref : null;
  const hasBusinessAccess: boolean = effectiveDashboardHref !== null;

  return {
    pathname,
    pathSegments,
    isCurrentlyInBusinessDashboard,
    businessId,
    hasBusinessAccess,
    merchantDashboardHref: effectiveDashboardHref,
    showAppNavbar: user !== null && pathname !== "/",
  };
}
