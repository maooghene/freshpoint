"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface FreshpointLogoProps {
  className?: string;
  size?: number;
  variant?: "full" | "mark";
}

export function FreshpointLogo({
  className,
  size = 18,
  variant = "full",
}: FreshpointLogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (variant === "mark") {
    return (
      <Image
        src="/freshpoint-mark.svg"
        alt="FreshPoint"
        width={size}
        height={size}
        className={className}
        priority
      />
    );
  }

  return (
    <Image
      src={isDark ? "/freshpoint-logo-dark.svg" : "/freshpoint-logo-light.svg"}
      alt="FreshPoint"
      width={size * 5.25}
      height={size}
      className={className}
      priority
    />
  );
}
