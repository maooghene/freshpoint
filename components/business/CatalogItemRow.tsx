"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PackageIcon,
  ClockIcon,
  Edit2Icon,
  Trash2Icon,
} from "lucide-react";

// Mirror our database/API type contracts exactly
export interface ItemVariantSummary {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number | null;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: "PRODUCT" | "SERVICE";
  image: string | null;
  stock: number | null;
  duration: number | null;
  variants?: ItemVariantSummary[];
  category?: { id: string; name: string } | null;
}

interface CatalogItemRowProps {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string) => void;
}

export function CatalogItemRow({
  item,
  onEdit,
  onDelete,
}: CatalogItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasVariants =
    item.type === "PRODUCT" && item.variants && item.variants.length > 0;

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Primary Row Header Section */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl object-cover border border-border bg-muted/40 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <PackageIcon className="size-6" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base truncate">
                {item.name}
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                  item.type === "PRODUCT"
                    ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                    : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                }`}
              >
                {item.type.toLowerCase()}
              </span>
              {item.category && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider bg-muted text-muted-foreground border-border">
                  {item.category.name}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {item.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Catalog Operational Indicators */}
        <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              Price
            </p>
            <p className="font-bold text-foreground mt-0.5">
              ₦{item.price.toLocaleString()}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 min-w-[80px]">
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              {item.type === "PRODUCT" ? "Stock" : "Duration"}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-foreground font-semibold">
              {item.type === "PRODUCT" ? (
                <>
                  <PackageIcon className="size-4 text-muted-foreground" />
                  <span>{item.stock ?? 0} units</span>
                </>
              ) : (
                <>
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <span>{item.duration ?? 30} mins</span>
                </>
              )}
            </div>
          </div>

          {/* Action Trigger Node Array */}
          <div className="flex items-center gap-2 shrink-0">
            {hasVariants && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="size-4" />
                ) : (
                  <ChevronDownIcon className="size-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
            >
              <Edit2Icon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 FASHION VARIATION EXPANDABLE DROPDOWN PANEL */}
      {hasVariants && isExpanded && (
        <div className="bg-muted/30 border-t border-border p-4 bg-muted/10 font-mono text-xs animate-in slide-in-from-top-1 duration-150">
          <p className="text-[10px] uppercase font-bold tracking-widest text-primary mb-3">
            Inventory Matrix Breakdown
          </p>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {item.variants?.map((v) => (
              <div
                key={v.id}
                className="bg-background border border-border/80 p-3 rounded-xl flex items-center justify-between shadow-xs"
              >
                <div className="flex flex-wrap gap-1.5">
                  {v.size && (
                    <span className="bg-muted text-foreground px-1.5 py-0.5 rounded font-bold">
                      Size: {v.size}
                    </span>
                  )}
                  {v.color && (
                    <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Color: {v.color}
                    </span>
                  )}
                </div>
                <span className="font-bold text-foreground">
                  Qty: {v.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
