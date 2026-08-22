// components/Banner.tsx
"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Sparkles, Megaphone } from "lucide-react";
import { getPublicAlertBannerText } from "@/lib/actions/admin-settings";

function Banner() {
  const { user } = useUser();
  const [alertNotice, setAlertNotice] = React.useState<string | null>(null);

  // Read the emergency settings text from the database when page loads
  React.useEffect(() => {
    async function loadAlert() {
      const liveText = await getPublicAlertBannerText();
      if (liveText && liveText.trim().length > 0) {
        setAlertNotice(liveText.trim());
      } else {
        setAlertNotice(null);
      }
    }
    loadAlert();
  }, []);

  // MODE A: EMERGENCY MODE (Shows your bright alert banner if text is entered)
  if (alertNotice) {
    return (
      <div className="fixed top-0 left-0 right-0 h-8 bg-amber-500 text-neutral-950 z-50 flex items-center justify-center px-4 text-xs font-bold tracking-tight shadow-sm select-none animate-in fade-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2">
          <Megaphone className="size-3.5 shrink-0 stroke-[2.5]" />
          <span>{alertNotice}</span>
        </div>
      </div>
    );
  }

  // MODE B: REGULAR MODE (Shows your normal onboard invite text if no emergency)
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
