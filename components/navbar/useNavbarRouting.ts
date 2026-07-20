// components/navbar/useNavbarRouting.ts
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function useNavbarRouting() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user, isLoaded, isSignedIn } = useUser();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [hasBusinessAccess, setHasBusinessAccess] = useState<boolean>(false);
  const [merchantDashboardHref, setMerchantDashboardHref] = useState<
    string | null
  >(null);
  const [portalLabel, setPortalLabel] = useState<string>("My Space");

  const pathSegments = pathname.split("/").filter(Boolean);
  const isCurrentlyInBusinessDashboard = pathname.startsWith("/business");
  const businessId = isCurrentlyInBusinessDashboard
    ? pathSegments[1] || ""
    : "";
  const showAppNavbar = !isCurrentlyInBusinessDashboard;

  useEffect(() => {
    if (!isSignedIn) {
      setHasBusinessAccess(false);
      setMerchantDashboardHref(null);
      setPortalLabel("My Space");
      return;
    }

    let isMounted = true;

    fetch("/api/auth/check-onboarding", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;

        // 🔐 FIXED: Access is granted ONLY if the user has an explicit role, or a destination that isn't a public profile landing
        const isAuthorizedUser =
          data.hasBusinessAccess === true ||
          (data.destination &&
            data.destination !== "/" &&
            data.destination !== "/onboarding");

        if (isAuthorizedUser) {
          setHasBusinessAccess(true);

          if (data.destination === "/select-workspace") {
            setPortalLabel("Manage Spaces");
            setMerchantDashboardHref("/select-workspace");
          } else if (
            data.destination &&
            data.destination.startsWith("/admin")
          ) {
            setPortalLabel("Admin Panel");
            setMerchantDashboardHref(data.destination);
          } else if (
            data.destination &&
            data.destination.startsWith("/business")
          ) {
            setPortalLabel("My Shop");
            setMerchantDashboardHref(data.destination);
          } else {
            setPortalLabel("Manage Spaces");
            setMerchantDashboardHref("/select-workspace");
          }
        } else {
          // Keep regular public consumer accounts locked down safely
          setHasBusinessAccess(false);
          setMerchantDashboardHref(null);
          setPortalLabel("My Space");
        }
      })
      .catch((err) => {
        console.error("Identity synchronization failure:", err);
        if (isMounted) {
          // Safeguard: Fail closed on network errors so links stay hidden until proven safe
          setHasBusinessAccess(false);
          setMerchantDashboardHref(null);
          setPortalLabel("My Space");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn]);

  const handlePortalNavigation = () => {
    if (!isLoaded || !user) {
      router.push("/sign-in");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);

        const onboardRes = await fetch(
          "/api/auth/check-onboarding?intent=manage",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!onboardRes.ok)
          throw new Error("Failed to process portal routing metadata.");

        const data = await onboardRes.json();

        if (data && data.destination) {
          window.location.href = data.destination;
          return;
        }

        router.push("/select-workspace");
      } catch (err: any) {
        console.error("[PORTAL_NAV_ERROR]:", err);
        window.location.href = "/select-workspace";
      }
    });
  };

  return {
    handlePortalNavigation,
    isNavigating: isPending,
    routingError: error,
    pathSegments,
    isCurrentlyInBusinessDashboard,
    businessId,
    hasBusinessAccess,
    merchantDashboardHref,
    portalLabel,
    showAppNavbar,
  };
}
