"use client";

import * as React from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import {
  EditForm,
  ServiceItem,
  ProductItem,
  ProductVariant,
  LocationOverrideRow,
} from "./types";
import { ProductVariantsManager } from "@/components/business/add-items/ProductVariantsManager";

export function EditItemModal({
  item,
  form,
  onChange,
  onSubmit,
  onClose,
  locationOverrides,
  loadingOverrides,
  savingOverrides,
  onOverridePriceChange,
  onOverrideAvailabilityChange,
  onSaveOverrides,
}: {
  item: ServiceItem | ProductItem;
  form: EditForm;
  onChange: (updated: EditForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  locationOverrides: LocationOverrideRow[];
  loadingOverrides: boolean;
  savingOverrides: boolean;
  onOverridePriceChange: (locationId: string, value: string) => void;
  onOverrideAvailabilityChange: (
    locationId: string,
    isAvailable: boolean,
  ) => void;
  onSaveOverrides: () => void;
}) {
  const isProduct = item.type === "PRODUCT";

  // 🚀 Read and initialize any pre-existing variations array safely from form memory state
  const currentVariants = React.useMemo(
    () => form.variants || [],
    [form.variants],
  );
  const hasActiveVariants = currentVariants.length > 0;

  // 💡 FIXED: Repaired broken React syntax and assigned explicit types to state modifiers
  const handleVariantsChange: React.Dispatch<
    React.SetStateAction<ProductVariant[]>
  > = (updateAction: React.SetStateAction<ProductVariant[]>) => {
    const nextVariants =
      typeof updateAction === "function"
        ? (updateAction as (prev: ProductVariant[]) => ProductVariant[])(
            currentVariants,
          )
        : updateAction;

    // 💡 FIXED: Added explicit types (number, ProductVariant) to the reduce parameters
    const calculatedTotalStock =
      nextVariants.length > 0
        ? nextVariants
            .reduce((sum: number, v: ProductVariant) => sum + v.stock, 0)
            .toString()
        : form.stock;

    onChange({
      ...form,
      stock: calculatedTotalStock,
      variants: nextVariants,
    });
  };

  // 🚀 Tells the TypeScript compiler that this helper handles string properties only
  const field = (key: Exclude<keyof EditForm, "variants">) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [key]: e.target.value }),
  });

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-background text-foreground disabled:opacity-60";

  // Only meaningful once a business has 2+ locations — a single-location
  // business has nothing to override against.
  const showLocationPricing = locationOverrides.length > 1;

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

        {/* Body + Actions */}
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
                  disabled={hasActiveVariants}
                  className={inputClass}
                  required
                />
              </div>
            )}
          </div>

          {isProduct && (
            <div className="space-y-4 pt-1 border-t border-primary/5">
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

          <div className="flex gap-3 pt-4 border-t border-border select-none">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border bg-background text-foreground font-medium transition-colors cursor-pointer hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>

          {/* LOCATION PRICING — separate save action from the base item
              form above, since it writes to a different endpoint. Only
              rendered once loading resolves AND the business actually has
              more than one location to override against. */}
          {loadingOverrides ? (
            <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground select-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading location pricing...
            </div>
          ) : (
            showLocationPricing && (
              <div className="pt-4 border-t border-border space-y-3 select-none">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold tracking-tight">
                    Location Pricing
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">
                  Leave price blank to use the standard ₦{item.price} price for
                  that branch.
                </p>

                <div className="space-y-2">
                  {locationOverrides.map((row) => (
                    <div
                      key={row.locationId}
                      className="rounded-xl border border-border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {row.locationName}
                          {row.isPrimary && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              Primary
                            </span>
                          )}
                        </span>
                        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.isAvailable}
                            onChange={(e) =>
                              onOverrideAvailabilityChange(
                                row.locationId,
                                e.target.checked,
                              )
                            }
                            className="cursor-pointer"
                          />
                          Available here
                        </label>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.price ?? ""}
                        onChange={(e) =>
                          onOverridePriceChange(row.locationId, e.target.value)
                        }
                        placeholder={`Default: ₦${item.price}`}
                        disabled={savingOverrides}
                        className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onSaveOverrides}
                  disabled={savingOverrides}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingOverrides ? "Saving..." : "Save Location Pricing"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
