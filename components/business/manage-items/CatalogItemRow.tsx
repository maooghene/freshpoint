"use client";

import * as React from "react";
import Image from "next/image";
import {
  PackageIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { ProductItem, ServiceItem } from "./types";
import { ItemActions } from "./ItemActions";

interface CatalogItemRowProps {
  // Can polymorphically accept either item type shape safely
  item: ProductItem | ServiceItem;
  currency: string;
  onToggle: (id: string, type: "PRODUCT" | "SERVICE") => Promise<void>;
  onEdit: (item: any) => void;
  onDelete: (id: string, type: "PRODUCT" | "SERVICE") => Promise<void>;
}

export function CatalogItemRow({
  item,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: CatalogItemRowProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Cast product properties safely if type checks out as a PRODUCT
  const isProduct = item.type === "PRODUCT";
  const productItem = isProduct ? (item as ProductItem) : null;
  const hasVariants = !!(
    productItem?.variants && productItem.variants.length > 0
  );

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Primary Row Grid Container Layout */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* EXPAND ACTION BUTTON FOR CLOTHING VARIANTS */}
          {hasVariants && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl border border-border text-muted-foreground/80 hover:bg-muted transition-colors cursor-pointer shrink-0"
            >
              {isExpanded ? (
                <ChevronUpIcon size={16} />
              ) : (
                <ChevronDownIcon size={16} />
              )}
            </button>
          )}

          {/* IMAGE LAYER RENDER BOUNDS */}
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border/40 bg-muted/40 flex items-center justify-center shrink-0 shadow-xs">
            {item.image ? (
              <Image
                fill
                src={item.image}
                alt={item.name}
                className="object-cover opacity-90"
                sizes="56px"
              />
            ) : (
              <PackageIcon size={20} className="text-primary/50" />
            )}
          </div>

          {/* BLOCK METADATA IDENTIFIER CELL */}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-foreground/90 tracking-wide truncate max-w-[180px]">
                {item.name}
              </h3>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase tracking-widest ${
                  isProduct
                    ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                    : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                }`}
              >
                {item.type}
              </span>
              {item.sku && (
                <span className="text-[9px] font-mono font-bold bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground/60 uppercase tracking-wider">
                  {item.sku}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground/80 line-clamp-1 max-w-[320px] font-normal tracking-wide">
              {item.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* METRICS & ACTIONS MATRIX LAYER */}
        <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
          {/* PRICE IDENTIFIER */}
          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60 select-none">
              Price
            </p>
            <p className="font-black text-primary/90 text-base tracking-wide mt-0.5">
              {currency}
              {item.price.toLocaleString()}
            </p>
          </div>

          {/* QUANTITY LEVEL / TIME TRACKER CELL */}
          <div className="text-left sm:text-right shrink-0 min-w-[90px]">
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60 select-none">
              {isProduct ? "Stock" : "Duration"}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-foreground/90 font-bold text-sm">
              {isProduct ? (
                <>
                  <PackageIcon className="size-4 text-muted-foreground/60" />
                  <span>{(item as ProductItem).stock ?? 0} Units</span>
                </>
              ) : (
                <>
                  <ClockIcon className="size-4 text-muted-foreground/60" />
                  <span>{(item as ServiceItem).duration ?? 30} Mins</span>
                </>
              )}
            </div>
          </div>

          {/* OPERATIONAL TOGGLE SWITCH CONTROL INDICATOR */}
          <div className="whitespace-nowrap shrink-0">
            <button
              type="button"
              onClick={() =>
                void toast.promise(onToggle(item.id, item.type), {
                  pending: "Syncing visibility...",
                  success: "Status adjusted successfully",
                  error: "Failed to alter status",
                })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer select-none ${
                item.isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs shadow-emerald-500/5"
                  : "bg-muted/40 text-muted-foreground/70 border-border/60"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full transition-all ${
                  item.isActive
                    ? "bg-emerald-400 animate-pulse ring-4 ring-emerald-400/10"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span>{item.isActive ? "Live" : "Hidden"}</span>
            </button>
          </div>

          {/* TRIGGER CALL SUB-MENU SYSTEM */}
          <div className="text-right whitespace-nowrap shrink-0">
            <ItemActions
              onEdit={() => onEdit(item)}
              onDelete={() =>
                void toast.promise(onDelete(item.id, item.type), {
                  pending: "Removing entry...",
                  success: "Item permanently purged",
                  error: "Process execution failure",
                })
              }
            />
          </div>
        </div>
      </div>

      {/* 🚀 EXTENDED SLIDE DRAWER VIEW: Renders nested size/color attributes cleanly */}
      {hasVariants && isExpanded && productItem && (
        <div className="bg-muted/10 border-t border-border/30 p-4 font-mono text-xs animate-in slide-in-from-top-1 duration-150 select-none">
          <p className="text-[10px] uppercase font-black tracking-widest text-primary/80 mb-3 pl-1">
            Product Option Array (Sizes & Colors Breakdown)
          </p>
          <div className="flex flex-wrap gap-2.5">
            {productItem.variants?.map((v) => (
              <div
                key={v.id}
                className="bg-background border border-border/80 px-4 py-2.5 rounded-xl flex items-center gap-4 text-foreground/90 font-medium shadow-xs"
              >
                <div className="flex gap-2">
                  {v.size && (
                    <span className="bg-muted border border-border/50 px-1.5 py-0.5 rounded font-bold text-foreground">
                      Size: {v.size}
                    </span>
                  )}
                  {v.color && (
                    <span className="bg-muted border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground">
                      Color: {v.color}
                    </span>
                  )}
                </div>
                <span className="font-bold text-foreground border-l border-border/60 pl-3">
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
