
// components/icons/FreshpointLogo.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface FreshpointLogoProps {
  size?: number;
  variant?: string;
}

export function FreshpointLogo({ size = 50 }: FreshpointLogoProps) {
  const { theme } = useTheme();
  // 🌟 FIX HOOK: Track whether the execution layout has mounted in the browser viewport
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedTheme = theme ?? "light";
  const isDark = resolvedTheme === "dark";

  // 🛡️ REWRITE PROTECTION SECTOR:
  // Render a structurally identical blank or neutral placeholder block during the server pass phase
  // to guarantee that initial client outputs align with server HTML definitions perfectly!
  if (!mounted) {
    return (
      <div
        style={{ width: size * 5.25, height: size }}
        className="bg-transparent shrink-0"
      />
    );
  }

  return (
    <Image
      src={isDark ? "/freshpoint-logo-dark.svg" : "/freshpoint-logo-light.svg"}
      alt="FreshPoint"
      width={size * 5.25}
      height={size}
      priority
      className="shrink-0 transition-opacity duration-200"
    />
  );
}
