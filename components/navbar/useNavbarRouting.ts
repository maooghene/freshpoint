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

  // 1. Maintain internal fetched server role state (Defaults to CUSTOMER initially)
  const [serverRole, setServerRole] = useState<string>("CUSTOMER");
  const [merchantDashboardHref, setMerchantDashboardHref] =
    useState<string>("/dashboard");

  // Track dynamic path evaluation markers directly from browser URL
  const pathSegments = useMemo(() => {
    return pathname.split("/").filter(Boolean);
  }, [pathname]);

  const isCurrentlyInBusinessDashboard = pathname.startsWith("/business");

  const businessId = useMemo<string>(() => {
    return isCurrentlyInBusinessDashboard && pathSegments.length > 1
      ? pathSegments[1]
      : "";
  }, [isCurrentlyInBusinessDashboard, pathSegments]);

  // 2. Deriving state safely during render.
  const userRole = user ? serverRole : "CUSTOMER";

  useEffect(() => {
    if (!user) return;

    // 💡 FIXED: Instantiate an AbortController loop to eliminate mid-air network unmount failures
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchIdentityContext = async () => {
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
            setMerchantDashboardHref(onboardData.destination);
          }
        }
      } catch (err) {
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

    // 💡 FIXED: Cleanup function runs instantly on unmount or user shift to cancel flying HTTP slots
    return () => {
      controller.abort();
    };
  }, [user]);

  const hasBusinessAccess =
    userRole === "BUSINESS_OWNER" || userRole === "STAFF";

  return {
    pathname,
    pathSegments,
    isCurrentlyInBusinessDashboard,
    businessId,
    hasBusinessAccess,
    merchantDashboardHref,
    showAppNavbar: user !== null && pathname !== "/",
  };
}
