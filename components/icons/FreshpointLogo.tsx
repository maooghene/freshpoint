"use client";

import * as React from "react";
// We import Sparkles as a temporary placeholder asset
import { Sparkles } from "lucide-react";

interface FreshpointLogoProps {
  className?: string;
  size?: number;
}

export function FreshpointLogo({ className, size = 18 }: FreshpointLogoProps) {
  return (
    // 🌟 THE WRAPPER PLACEHOLDER:
    // Right now, this displays the temporary Sparkles asset.
    // When your logo is ready, you will open ONLY this file, delete this tag,
    // and paste your new logo's SVG or image asset here.
    <Sparkles size={size} className={className} />
  );
}
