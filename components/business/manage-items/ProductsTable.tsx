"use client";

import * as React from "react";
import Image from "next/image";
import { PackageIcon } from "lucide-react";
import { toast } from "react-toastify";
// 💡 FIXED: Imported your true custom UI Badge component cleanly to remove the attributes error
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
        {/* 💡 NOW SAFE: Your Shadcn badge component handles the variant correctly without crashing */}
        <Badge
          variant="secondary"
          className="font-bold text-xs bg-indigo-500/10 text-indigo-400 border-none"
        >
          {products.length} Items
        </Badge>
      </div>

      {/* 💡 FIXED: overflow-x-auto injects a side scrollbar for small mobile screens */}
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
              <tr
                key={product.id}
                className="hover:bg-muted/30 transition-colors duration-150 group"
              >
                {/* PRODUCT IDENTIFIER CELL */}
                <td className="px-6 py-4 flex gap-4 items-center min-w-[300px]">
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

                {/* EMERALD DASHBOARD INDICATOR LIGHT CELL */}
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
