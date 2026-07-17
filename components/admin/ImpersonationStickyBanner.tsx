// components/admin/ImpersonationStickyBanner.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getImpersonationContext,
  stopImpersonationAction,
  ImpersonationState,
} from "@/lib/actions/admin-impersonate";
import { EyeOff } from "lucide-react";

export function ImpersonationStickyBanner() {
  const [isPending, startTransition] = useTransition();
  const [ctx, setCtx] = useState<ImpersonationState | null>(null);

  // Fetch the context client-side to keep layout rendering perfectly isolated
  useEffect(() => {
    async function checkState() {
      const state = await getImpersonationContext();
      setCtx(state);
    }
    checkState();
  }, [isPending]);

  if (!ctx || !ctx.isImpersonating) return null;

  const handleExitClick = () => {
    startTransition(async () => {
      const res = await stopImpersonationAction();
      if (res.success) {
        // 🌟 FORCE REDIRECT: Escapes vendor profile layout space instantly to drop cleanly onto the Admin panel path
        window.location.href = res.redirectUrl;
      }
    });
  };

  return (
    <div className="w-full bg-linear-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-50 animate-slide-down">
      <div className="flex items-center gap-2">
        <EyeOff className="h-4 w-4 animate-pulse" />
        <span>
          ADMIN SECURITY TUNNEL: You are currently acting on behalf of{" "}
          <span className="underline font-black">{ctx.businessName}</span> (/
          {ctx.businessSlug}).
        </span>
      </div>
      <button
        onClick={handleExitClick}
        disabled={isPending}
        className="bg-white/20 hover:bg-white/30 text-white border border-white/20 px-3 py-1 rounded-lg transition font-black tracking-tight cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Exiting..." : "Exit Session"}
      </button>
    </div>
  );
}
