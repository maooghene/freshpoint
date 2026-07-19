"use client";

import React from "react";
import { CatalogItem, CatalogItemRow } from "./CatalogItemRow";
import { InboxIcon } from "lucide-react";

interface MerchantCatalogGridProps {
  items: CatalogItem[];
  onEditItem: (item: CatalogItem) => void;
  onDeleteItem: (id: string) => void;
}

export function MerchantCatalogGrid({
  items,
  onEditItem,
  onDeleteItem,
}: MerchantCatalogGridProps) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-[2rem] p-12 text-center max-w-xl mx-auto mt-6 bg-muted/10">
        <InboxIcon className="size-10 text-muted-foreground/60 mx-auto stroke-1" />
        <h4 className="mt-4 font-semibold text-foreground text-lg">
          No active workspace catalog items
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          Get started by publishing your first wellness service or retail
          fashion product option.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto mt-6">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
          Showing {items.length}{" "}
          {items.length === 1 ? "catalog element" : "catalog elements"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <CatalogItemRow
            key={item.id}
            item={item}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
}
