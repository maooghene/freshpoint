"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { LucideIcon } from "lucide-react";

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  icon: LucideIcon;
  label: string;
  sizes?: string;
  className?: string;
  containerClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  icon: Icon,
  label,
  sizes = "(max-w-7xl) 50vw",
  className = "object-cover",
  containerClassName = "",
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // ✅ Reset error state during render when src changes — the React-recommended
  // pattern instead of a useEffect + setState, which causes an extra render pass.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }

  const hasValidImage = src && src.trim().length > 0 && !hasError;

  if (hasValidImage) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary/40 p-2 text-center select-none animate-in fade-in duration-200 ${containerClassName}`}
    >
      <Icon className="w-5 h-5 mb-1 text-primary/30" />
      <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">
        {label}
      </span>
    </div>
  );
}
