"use client";

import React from "react";
import { ItemType } from "./index";

interface AddItemHeaderProps {
  type: ItemType;
}

export function AddItemHeader({ type }: AddItemHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {"Add New "}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {type === "SERVICE" ? "Service" : "Product"}
        </span>
      </h1>
      <p className="text-muted-foreground text-sm font-medium">
        {type === "SERVICE"
          ? "Define an offering for booking."
          : "List a physical item for retail sale."}
      </p>
    </div>
  );
}
