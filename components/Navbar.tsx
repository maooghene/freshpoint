// components/Navbar.tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavbarContent } from "./NavbarContent"; // Points right to your orchestrator file!

export default function Navbar() {
  const pathname = usePathname();

  // Hide global navbar on any business pages
  if (pathname?.startsWith("/business")) return null;

  return (
    <Suspense
      fallback={
        <nav className="fixed top-0 right-0 left-0 z-50 px-6 border-b border-border bg-background h-16 flex items-center select-none">
          <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Sparkles className="size-6 text-primary animate-pulse" />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black tracking-tight">
                Freshpoint
              </span>
            </div>
            <div className="w-24 h-8 bg-muted rounded-xl animate-pulse" />
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
