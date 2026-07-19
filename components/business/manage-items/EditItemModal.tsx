"use client";

import * as React from "react";
import { X } from "lucide-react";
import { EditForm, ServiceItem, ProductItem, ProductVariant } from "./types";
import { ProductVariantsManager } from "@/components/business/add-items/ProductVariantsManager";

export function EditItemModal({
  item,
  form,
  onChange,
  onSubmit,
  onClose,
}: {
  item: ServiceItem | ProductItem;
  form: EditForm;
  onChange: (updated: EditForm) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const isProduct = item.type === "PRODUCT";

  // 🚀 Read and initialize any pre-existing variations array safely from form memory state
  const currentVariants = React.useMemo(
    () => form.variants || [],
    [form.variants],
  );
  const hasActiveVariants = currentVariants.length > 0;

  // React state modifier to feed changes back up through your shared parent state tracker hook
  const handleVariantsChange: React.Dispatch<
    React.SetStateAction<ProductVariant[]>
  > = (updateAction) => {
    const nextVariants =
      typeof updateAction === "function"
        ? updateAction(currentVariants)
        : updateAction;

    // Automatically recalculate the absolute aggregate stock total whenever choice metrics shuffle
    const calculatedTotalStock =
      nextVariants.length > 0
        ? nextVariants.reduce((sum, v) => sum + v.stock, 0).toString()
        : form.stock;

    onChange({
      ...form,
      stock: calculatedTotalStock,
      variants: nextVariants,
    });
  };

  // 🚀 FIXED: Tells the TypeScript compiler that this helper handles string properties only
  const field = (key: Exclude<keyof EditForm, "variants">) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [key]: e.target.value }),
  });

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-background text-foreground disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-background rounded-2xl border border-primary/10 shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 select-none">
          <h3 className="text-lg font-bold text-foreground">
            Edit {item.type === "SERVICE" ? "Service" : "Product"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
              Name
            </label>
            <input
              type="text"
              {...field("name")}
              placeholder="Enter name"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
              Description
            </label>
            <textarea
              {...field("description")}
              rows={3}
              placeholder="Brief description..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
                Price (₦)
              </label>
              <input
                type="number"
                {...field("price")}
                className={inputClass}
                required
              />
            </div>
            {!isProduct ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  {...field("duration")}
                  className={inputClass}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
                  Stock
                </label>
                <input
                  type="number"
                  {...field("stock")}
                  // 🚀 FIXED: Locks down flat stock manual entering if explicit sizes/colors are managed
                  disabled={hasActiveVariants}
                  className={inputClass}
                  required
                />
              </div>
            )}
          </div>

          {isProduct && (
            <div className="space-y-4 pt-1 border-t border-primary/5">
              {/* 🚀 FASHION VARIATION MANAGER ROW INJECTION POINT */}
              <div className="pt-2">
                <ProductVariantsManager
                  variants={currentVariants}
                  setVariants={handleVariantsChange}
                />
              </div>

              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest pt-2 select-none">
                Inventory Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
                    SKU
                  </label>
                  <input
                    type="text"
                    {...field("sku")}
                    placeholder="e.g. PROD-001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
                    Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    {...field("costPrice")}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="w-1/2 pr-2">
                <label className="text-sm font-medium text-muted-foreground block mb-1 select-none">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  {...field("weight")}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 border-t bg-muted/30 shrink-0 select-none">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border bg-background text-foreground font-medium transition-colors cursor-pointer hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
