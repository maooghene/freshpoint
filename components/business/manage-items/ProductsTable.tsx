"use client";

import * as React from "react";
import Image from "next/image";
import { PackageIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { ProductItem } from "./types";
import { ItemActions } from "./ItemActions";

interface ProductsTableProps {
  products: ProductItem[];
  currency: string;
  onToggle: (id: string, type: "PRODUCT") => Promise<void>;
  onEdit: (item: ProductItem) => void;
  onDelete: (id: string, type: "PRODUCT") => Promise<void>;
}

// 🚀 ISOLATED ROW ENGINE: Manages its own expansion states safely
function ProductRow({
  product,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: ProductItem;
  currency: string;
  onToggle: (id: string, type: "PRODUCT") => Promise<void>;
  onEdit: (item: ProductItem) => void;
  onDelete: (id: string, type: "PRODUCT") => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors duration-150 group">
        {/* PRODUCT IDENTIFIER CELL */}
        <td className="px-6 py-4 flex gap-4 items-center min-w-[300px]">
          {/* Collapse/Expand toggle icon if product features sizes or colors */}
          {hasVariants && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg border border-border/60 text-muted-foreground/80 hover:bg-muted transition-colors cursor-pointer shrink-0"
            >
              {isExpanded ? (
                <ChevronUpIcon size={14} />
              ) : (
                <ChevronDownIcon size={14} />
              )}
            </button>
          )}

          <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border/40 bg-muted/40 flex items-center justify-center shrink-0 shadow-xs">
            {product.image ? (
              <Image
                fill
                src={product.image}
                alt={product.name}
                className="object-cover opacity-90"
                sizes="48px"
              />
            ) : (
              <PackageIcon size={16} className="text-primary/50" />
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-bold text-base text-foreground/90 tracking-wide truncate max-w-[160px]">
                {product.name}
              </p>
              {product.sku && (
                <span className="text-[9px] font-mono font-bold bg-muted border border-border/50 px-1.5 py-0.5 rounded text-muted-foreground/60 uppercase tracking-wider scale-90">
                  {product.sku}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground/80 line-clamp-1 max-w-[260px] font-normal tracking-wide">
              {product.description || "No description provided."}
            </p>
          </div>
        </td>

        {/* STOCK LEVEL CELL */}
        <td className="px-6 py-4 font-bold text-base text-foreground/90 tracking-wide whitespace-nowrap">
          {product.stock ?? 0} Units
        </td>

        {/* PRICE CELL */}
        <td className="px-6 py-4 font-black text-primary/90 text-base tracking-wide whitespace-nowrap">
          {currency}
          {product.price.toLocaleString()}
        </td>

        {/* INDICATOR LIGHT CELL */}
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            type="button"
            onClick={() =>
              void toast.promise(onToggle(product.id, "PRODUCT"), {
                pending: "Updating...",
                success: "Product state synced",
                error: "Failed to alter status",
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer select-none ${
              product.isActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs shadow-emerald-500/5"
                : "bg-muted/40 text-muted-foreground/70 border-border/60"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full transition-all ${
                product.isActive
                  ? "bg-emerald-400 animate-pulse ring-4 ring-emerald-400/10"
                  : "bg-muted-foreground/40"
              }`}
            />
            <span>{product.isActive ? "Live" : "Hidden"}</span>
          </button>
        </td>

        {/* ACTIONS TRIGGER CELL */}
        <td className="px-6 py-4 text-right whitespace-nowrap">
          <ItemActions
            onEdit={() => onEdit(product)}
            onDelete={() =>
              void toast.promise(onDelete(product.id, "PRODUCT"), {
                pending: "Deleting...",
                success: "Product deleted from inventory",
                error: "Purge process failed",
              })
            }
          />
        </td>
      </tr>

      {/* 🚀 SUB-NESTED CLOTHING/SHOES OPTION LAYOUT CONTAINER */}
      {hasVariants && isExpanded && (
        <tr className="bg-muted/10 font-mono text-xs">
          <td colSpan={5} className="px-8 py-4 border-t border-border/30">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black tracking-widest text-primary/80 mb-2 select-none">
                Inventory Option Rows (Sizes & Colors)
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.variants?.map((v) => (
                  <div
                    key={v.id}
                    className="bg-background/80 backdrop-blur-xs border border-border/80 px-4 py-2.5 rounded-xl flex items-center gap-4 text-foreground/90 font-medium shadow-xs"
                  >
                    <div className="flex gap-2">
                      {v.size && (
                        <span className="bg-muted border px-1.5 py-0.5 rounded font-bold text-foreground">
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
          </td>
        </tr>
      )}
    </>
  );
}

export function ProductsTable({
  products,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4 max-w-5xl mx-auto pt-4">
      <div className="flex items-center justify-between border-b border-border/30 pb-2">
        <h2 className="text-xl font-black text-foreground/90 tracking-wide">
          Products & Retail Stock
        </h2>
        <Badge
          variant="secondary"
          className="font-bold text-xs bg-indigo-500/10 text-indigo-400 border-none"
        >
          {products.length} Items
        </Badge>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border/50 bg-background/40 backdrop-blur-md shadow-xl scrollbar-thin scrollbar-thumb-border">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-muted/40 text-muted-foreground/80 text-xs uppercase tracking-widest font-black border-b border-border/40 select-none">
            <tr>
              <th className="px-6 py-4.5 min-w-[300px]">Product Details</th>
              <th className="px-6 py-4.5 w-32">Stock Level</th>
              <th className="px-6 py-4.5 w-36">Retail Price</th>
              <th className="px-6 py-4.5 w-32">Status</th>
              <th className="px-6 py-4.5 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-foreground/90">
            {products.map((product: ProductItem) => (
              <ProductRow
                key={product.id}
                product={product}
                currency={currency}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
