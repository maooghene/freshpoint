// components/auth/OnboardingRedirectTracker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export function OnboardingRedirectTracker() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const executionGuard = useRef<boolean>(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || executionGuard.current) return;

    executionGuard.current = true;
    setIsEvaluating(true);

    async function evaluateUserWorkspaceDestination(): Promise<void> {
      try {
        // Extract the active browser clearance parameter state
        let tokenValue = "false";
        if (typeof window !== "undefined" && window.sessionStorage) {
          tokenValue =
            window.sessionStorage.getItem("freshpoint_exit_clearance") ||
            "false";
        }

        // Send check request containing validation parameters
        const response = await fetch("/api/auth/onboarding-check", {
          method: "GET",
          cache: "no-store",
          headers: {
            Pragma: "no-cache",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "x-freshpoint-exit-clearance": tokenValue, // 🌟 PASS THE STATUS TO THE SERVER
          },
        });

        if (!response.ok) throw new Error("Network request barrier.");

        const data = (await response.json()) as { destination: string | null };

        // If the server returns a destination path string, execute layout navigation immediately
        if (data && data.destination) {
          window.location.href = data.destination;
          return;
        }

        // If server data destination payload evaluates to null, dismiss tracker loader gracefully
        setIsEvaluating(false);
      } catch (err) {
        console.error("Tracker routing sync failed:", err);
        setIsEvaluating(false);
      }
    }

    void evaluateUserWorkspaceDestination();
  }, [isSignedIn, isLoaded, user]);

  if (!isLoaded || !isSignedIn || !isEvaluating) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col items-center justify-center font-sans antialiased select-none">
      <div className="text-center space-y-3 p-6 max-w-sm mx-auto">
        <Loader2 className="animate-spin text-indigo-600 h-12 w-12 mx-auto" />
        <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
          Verifying Session
        </h2>
      </div>
    </div>
  );
}
