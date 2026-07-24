"use client";

import React, { useEffect, useState } from "react";
import { SparklesIcon, PackageIcon, Clock1Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUpload from "./ImageUpload";
import { ItemType, ItemFormState, VariantState } from "./index";
import { ProductVariantsManager } from "./ProductVariantsManager";

interface CategoryOption {
  id: string;
  name: string;
}

interface ItemCoreFieldsGridProps {
  type: ItemType;
  loading: boolean;
  serviceInfo: ItemFormState;
  onChangeHandler: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  setImage: (file: File | null) => void;
  setImagePreview: (url: string | null) => void;
  variants: VariantState[];
  setVariants: React.Dispatch<React.SetStateAction<VariantState[]>>;
}

export function ItemCoreFieldsGrid({
  type,
  loading,
  serviceInfo,
  onChangeHandler,
  handleImageChange,
  imagePreview,
  setImage,
  setImagePreview,
  variants,
  setVariants,
}: ItemCoreFieldsGridProps): React.JSX.Element {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Re-fetches taxonomies based on what track is active in ItemTypeToggle
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(`/api/categories/items?type=${type}`);
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        if (isMounted) setCategories(data.categories ?? []);
      } catch (err) {
        console.error("Category fetch error:", err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };
    void fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [type]);


  
  return (
    <div className="grid gap-6 bg-background/40 backdrop-blur-md border border-primary/10 p-8 rounded-[2rem] shadow-xl">
      {/* ✓ CATEGORY FIRST */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block select-none">
          Category (optional)
        </label>
        <div className="relative">
          <select
            name="categoryId"
            disabled={loading || categoriesLoading}
            onChange={onChangeHandler}
            value={serviceInfo.categoryId}
            className="flex h-12 w-full rounded-xl border border-primary/10 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none appearance-none disabled:opacity-50"
          >
            <option value="" className="bg-background text-muted-foreground">
              {categoriesLoading
                ? "Loading categories..."
                : "No category (optional)"}
            </option>
            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.id}
                className="bg-background text-foreground"
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === "PRODUCT" && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasVariants"
            name="hasVariants"
            checked={serviceInfo.hasVariants}
            onChange={onChangeHandler}
            disabled={loading}
            className="size-4 rounded border-primary/30"
          />
          <label
            htmlFor="hasVariants"
            className="text-sm text-foreground select-none cursor-pointer"
          >
            This product comes in multiple sizes or colors
          </label>
        </div>
      )}

      {/* ✓ IMAGE SELECTION SECOND */}
      <ImageUpload
        type={type}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onClearImage={() => {
          setImage(null);
          setImagePreview(null);
        }}
      />

      {/* NAME SPECIFICATION FIELD */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block select-none">
          Name
        </label>
        <Input
          name="name"
          disabled={loading}
          onChange={onChangeHandler}
          value={serviceInfo.name}
          placeholder={
            type === "SERVICE"
              ? "e.g. Deep Tissue Massage"
              : "e.g. Standard Product Entry"
          }
          className="bg-background/50 border-primary/10 h-12 rounded-xl text-foreground"
          required
        />
      </div>

      {/* DESCRIPTION BLOCK CONTAINER */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block select-none">
          Description
        </label>
        <Textarea
          name="description"
          disabled={loading}
          onChange={onChangeHandler}
          value={serviceInfo.description}
          placeholder="Details about the item..."
          rows={3}
          className="bg-background/50 border-primary/10 rounded-xl resize-none text-foreground"
          required
        />
      </div>

      {/* METRICS SPLIT: PRICING AND VALUE FIELDS */}
      <div
        className={`grid ${type === "SERVICE" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-6`}
      >
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block select-none">
            Price (₦)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
              ₦
            </span>
            <Input
              type="number"
              name="price"
              disabled={loading}
              onChange={onChangeHandler}
              value={serviceInfo.price}
              className="pl-10 bg-background/50 border-primary/10 h-12 rounded-xl text-foreground"
              required
            />
          </div>
        </div>

        {type === "SERVICE" && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block select-none">
              Duration (Mins)
            </label>
            <div className="relative">
              <Clock1Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary size-4" />
              <Input
                type="number"
                name="duration"
                disabled={loading}
                onChange={onChangeHandler}
                value={serviceInfo.duration}
                className="pl-10 bg-background/50 border-primary/10 h-12 rounded-xl text-foreground"
                required
              />
            </div>
          </div>
        )}

        {/* 🚀 FIXED GATING: Standalone stock inputs are visible ONLY for normal products with NO active variants */}
        {type === "PRODUCT" && !serviceInfo.hasVariants && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block select-none">
              Stock Quantity
            </label>
            <Input
              type="number"
              name="stock"
              disabled={loading}
              onChange={onChangeHandler}
              value={serviceInfo.stock}
              placeholder="Quantity available"
              className="bg-background/50 border-primary/10 h-12 rounded-xl text-foreground"
              required={type === "PRODUCT" && !serviceInfo.hasVariants}
            />
          </div>
        )}
      </div>

      {/* 🚀 FIXED VARIANT CONDITION: Reveals size/color panel ONLY if the type is PRODUCT AND the selected category matches clothing keywords */}
      {serviceInfo.hasVariants && (
        <ProductVariantsManager
          variants={variants}
          setVariants={setVariants}
          disabled={loading}
        />
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-12 h-14 mt-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
      >
        {type === "SERVICE" ? (
          <SparklesIcon className="mr-2 size-5" />
        ) : (
          <PackageIcon className="mr-2 size-5" />
        )}
        {loading
          ? "Publishing..."
          : `Publish ${type === "SERVICE" ? "Service" : "Product"}`}
      </Button>
    </div>
  );
}
