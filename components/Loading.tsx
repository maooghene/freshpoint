"use client";

import React from "react";

const Loading = () => {
  return (
    <div className="relative flex items-center justify-center h-auto py-6 bg-transparent w-full">
      {/* Dynamic Brand Glow Background Effect */}
      <div className="absolute w-24 h-24 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" />

      <div className="flex flex-col items-center gap-4 relative z-10">
        {/* Modern Spinning Architectural Loader */}
        <div className="relative w-12 h-12">
          {/* Static Outer Contrast Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/10"></div>
          {/* Active Accelerated Spinning Shard */}
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin shadow-md shadow-primary/40"></div>
        </div>

        {/* Universal Application Branding Text */}
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground animate-pulse">
          Fresh<span className="text-primary">point</span>
        </p>
      </div>
    </div>
  );
};

export default Loading;
