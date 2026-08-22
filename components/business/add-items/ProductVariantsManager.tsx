"use client";

import React, { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 🚀 FIXED: Type contract aligned with your global schema definitions to allow nullable values
export interface VariantState {
  id?: string;
  size: string | null;
  color: string | null;
  stock: number;
  price?: number | null;
}

interface ProductVariantsManagerProps {
  variants: VariantState[];
  setVariants: React.Dispatch<React.SetStateAction<any[]>>;
  disabled?: boolean;
  basePrice?: string;
}

export function ProductVariantsManager({
  variants,
  setVariants,
  disabled = false,
  basePrice,
}: ProductVariantsManagerProps): React.JSX.Element {
  const [vSize, setVSize] = useState("");
  const [vColor, setVColor] = useState("");
  const [vStock, setVStock] = useState("1");
  const [vPrice, setVPrice] = useState("");

  const addVariantRow = () => {
    if (!vSize.trim() && !vColor.trim()) return;

    const trimmedPrice = vPrice.trim();
    const parsedPrice =
      trimmedPrice.length > 0 && !isNaN(parseFloat(trimmedPrice))
        ? parseFloat(trimmedPrice)
        : null;

    setVariants((prev) => [
      ...prev,
      {
        size: vSize.trim() || null,
        color: vColor.trim() || null,
        stock: parseInt(vStock || "1", 10),
        price: parsedPrice, // null = falls back to base item price
      },
    ]);
    setVSize("");
    setVColor("");
    setVStock("1");
    setVPrice("");
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-4">
      <label className="text-xs font-bold uppercase tracking-widest text-primary block select-none">
        Product Sizes & Colors Options (Variants)
      </label>
      <p className="text-[11px] text-muted-foreground -mt-2">
        Leave price blank to use the base product price for that option.
      </p>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[80px]">
          <Input
            placeholder="Size (S, M, L, 42)"
            value={vSize}
            onChange={(e) => setVSize(e.target.value)}
            disabled={disabled}
            className="bg-background/60"
          />
        </div>
        <div className="flex-grow min-w-[120px]">
          <Input
            placeholder="Color (Black, White)"
            value={vColor}
            onChange={(e) => setVColor(e.target.value)}
            disabled={disabled}
            className="bg-background/60"
          />
        </div>
        <div className="w-20">
          <Input
            type="number"
            placeholder="Qty"
            value={vStock}
            onChange={(e) => setVStock(e.target.value)}
            disabled={disabled}
            className="bg-background/60"
          />
        </div>
        <div className="w-28">
          <Input
            type="number"
            placeholder={basePrice ? `₦${basePrice}` : "Price"}
            value={vPrice}
            onChange={(e) => setVPrice(e.target.value)}
            disabled={disabled}
            className="bg-background/60"
            min="0"
            step="0.01"
          />
        </div>
        <Button
          type="button"
          onClick={addVariantRow}
          disabled={disabled}
          className="h-10 rounded-xl px-3 cursor-pointer shrink-0"
        >
          <PlusIcon className="size-4 mr-1" /> Add Option
        </Button>
      </div>

      {variants.length > 0 && (
        <div className="divide-y divide-border border rounded-xl bg-background/40 overflow-hidden">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 text-sm text-foreground select-none"
            >
              <div className="font-mono">
                {v.size && (
                  <span className="bg-muted px-2 py-0.5 rounded mr-2 font-bold text-xs border border-border/40">
                    Size: {v.size}
                  </span>
                )}
                {v.color && (
                  <span className="bg-muted px-2 py-0.5 rounded text-xs border border-border/40">
                    Color: {v.color}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-xs text-muted-foreground">
                  Qty: {v.stock}
                </span>
                <span className="text-xs font-bold text-primary">
                  {v.price != null
                    ? `₦${Number(v.price).toLocaleString()}`
                    : "Base price"}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariantRow(idx)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
