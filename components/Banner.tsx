"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

function Banner() {
  const { user } = useUser();

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground z-50 flex items-center justify-center px-4 text-xs font-medium tracking-wide shadow-sm animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 animate-pulse hidden sm:inline" />
        <span>Are you a salon, spa, or wellness space owner?</span>
        <Link
          href={user ? "/register-business" : "/sign-up"}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-90 active:opacity-75 transition-all font-semibold ml-1"
        >
          List your space on Freshpoint
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

export default Banner;
