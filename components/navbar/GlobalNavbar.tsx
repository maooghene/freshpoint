// components/navbar/GlobalNavbar.tsx
"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { LayoutDashboard, ShoppingBag, ShieldAlert, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface AdminCheckResponse {
  isAdmin: boolean;
  isPlatformStaff: boolean;
}

export function GlobalNavbar() {
  const { user, isLoaded } = useUser();
  const [isPending, startTransition] = useTransition();
  const [authContext, setAuthContext] = useState<AdminCheckResponse>({ isAdmin: false, isPlatformStaff: false });

  useEffect(() => {
    if (!user) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-admin-status");
        if (res.ok) {
          const data: AdminCheckResponse = await res.json();
          setAuthContext(data);
        }
      } catch (err) {
        console.error("ADMIN_NAVBAR_RESOLVER_ERROR:", err);
      }
    });
  }, [user]);

  const showAdminPortalLink = authContext.isAdmin || authContext.isPlatformStaff;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card text-card-foreground z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        
        {/* Brand Anchor Logo */}
        <Link href="/" className="font-black tracking-tighter text-lg text-foreground hover:opacity-90 transition-opacity">
          🍇 FreshPoint
        </Link>

        {/* Global Action Nodes */}
        <div className="flex items-center gap-4">
          <Link 
            href="/explore" 
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Explore
          </Link>
          
          <Link 
            href="/cart" 
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg relative transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>

          {/* 🔐 Administrative Gate Anchor Button */}
          {isLoaded && showAdminPortalLink && (
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground border border-primary/20 hover:opacity-90 shadow-sm transition-all"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}

          {isPending && <Loader2 className="animate-spin h-4 w-4 text-primary" />}

          {/* Authentication State Wrapper */}
          <div className="flex items-center pl-2 border-l border-border h-6">
            <UserButton />
          </div>
        </div>

      </div>
    </nav>
  );
}
