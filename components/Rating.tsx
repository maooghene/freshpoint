"use client";

import { StarIcon } from "lucide-react";
import React from "react";

interface RatingProps {
  value?: number;
  size?: number;
}

const Rating = ({ value = 5, size = 14 }: RatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          size={size}
          className={`shrink-0 transition-all duration-300 ${
            value > i
              ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)] scale-100"
              : "text-secondary/60 fill-transparent stroke-1.5"
          }`}
        />
      ))}
      <span className="sr-only">{value} out of 5 stars</span>
    </div>
  );
};

export default Rating;
