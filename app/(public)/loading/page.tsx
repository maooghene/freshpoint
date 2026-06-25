"use client";

import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Safely reads the query parameters inside the client execution environment
    const params = new URLSearchParams(window.location.search);
    const nextUrl = params.get("nextUrl");

    if (nextUrl) {
      // PERFORMANCE OPTIMIZATION: Dropped transition block delay from 8000ms to 2500ms
      const timeout = setTimeout(() => {
        router.push(nextUrl);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* FRESHPOINT THEME BACKGROUND GLOW ORB */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />

      <div className="space-y-6 flex flex-col items-center max-w-sm w-full px-6">
        {/* Core dynamic design loading animation engine */}
        <Loading />

        {/* REBRANDED INTERFACE CAPTIONS */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Freshpoint Secure Gate
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Synchronizing your multi-tenant workspace profile...
          </p>
        </div>
      </div>
    </div>
  );
}
