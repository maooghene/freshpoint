"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function OnboardingRedirectTracker(): null {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Stop running if the Clerk auth layer is still parsing session tokens
    if (!isLoaded || !isSignedIn) return;

    // 🛡️ REACT 19 SYNCHRONOUS LIFECYCLE BYPASS GATE:
    // Read directly from browser memory. No state modifications means zero cascading render phases!
    if (typeof window !== "undefined" && window.sessionStorage) {
      const clearanceToken = window.sessionStorage.getItem(
        "freshpoint_exit_clearance",
      );
      if (clearanceToken === "true") {
        console.log(
          "🔒 [FreshPoint Auth] Exit Workspace clearance active. Disarming automated routing traps.",
        );
        return;
      }
    }

    async function evaluateUserWorkspaceDestination(): Promise<void> {
      try {
        const response = await fetch("/api/auth/check-onboarding");
        if (response.ok) {
          const data = (await response.json()) as { destination: string };

          /* 
            🎯 THE CONDITIONAL ESCAPE HOOK:
            Only force automatic redirects for staff portals (/staff/dashboard).
            Business owners are allowed to stay on the public home feed and access 
            their management panels manually via the Navigation bar options.
          */
          if (data.destination && data.destination.startsWith("/staff")) {
            router.replace(data.destination);
          }
        }
      } catch (err: unknown) {
        console.error(
          "Failed executing homepage onboarding synchronization rules:",
          err,
        );
      }
    }

    void evaluateUserWorkspaceDestination();
  }, [isSignedIn, isLoaded, router]);

  // Renders zero physical content nodes to keep your DOM tree layout clean and fast
  return null;
}
