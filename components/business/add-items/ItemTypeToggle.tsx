"use client";

import React from "react";
import { SparklesIcon, PackageIcon } from "lucide-react";
import { ItemType } from "./index";

interface ItemTypeToggleProps {
  type: ItemType;
  setType: (type: ItemType) => void;
  loading: boolean;
}

export function ItemTypeToggle({
  type,
  setType,
  loading,
}: ItemTypeToggleProps): React.JSX.Element {
  return (
    <div className="flex p-1 bg-secondary/50 rounded-2xl mb-6 w-fit border border-primary/5">
      <button
        type="button"
        disabled={loading}
        onClick={() => setType("SERVICE")}
        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          type === "SERVICE"
            ? "bg-background shadow-md text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <SparklesIcon size={16} /> Service
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => setType("PRODUCT")}
        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          type === "PRODUCT"
            ? "bg-background shadow-md text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <PackageIcon size={16} /> Product
      </button>
    </div>
  );
}
