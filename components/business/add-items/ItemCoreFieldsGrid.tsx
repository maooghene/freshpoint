"use client";

import React from "react";
import { SparklesIcon, PackageIcon, Clock1Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUpload from "./ImageUpload";
import { MARKETPLACE_CATEGORIES } from "@/lib/constants";
import { ItemType, ItemFormState } from "./index";

interface ItemCoreFieldsGridProps {
  type: ItemType;
  loading: boolean;
  serviceInfo: ItemFormState;
  imagePreview: string | null;
  onChangeHandler: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setImage: (file: File | null) => void;
  setImagePreview: (url: string | null) => void;
}

export function ItemCoreFieldsGrid({
  type,
  loading,
  serviceInfo,
  imagePreview,
  onChangeHandler,
  handleImageChange,
  setImage,
  setImagePreview,
}: ItemCoreFieldsGridProps): React.JSX.Element {
  return (
    <div className="grid gap-6 bg-background/40 backdrop-blur-md border border-primary/10 p-8 rounded-[2rem] shadow-xl">
      <ImageUpload
        type={type}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onClearImage={() => {
          setImage(null);
          setImagePreview(null);
        }}
      />

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
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
              : "e.g. Organic Essential Oils"
          }
          className="bg-background/50 border-primary/10 h-12 rounded-xl text-foreground"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
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

      <div
        className={`grid ${type === "SERVICE" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-6`}
      >
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
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
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
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

        {type === "PRODUCT" && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
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
              required
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
          Category
        </label>
        <div className="relative">
          <select
            name="category"
            disabled={loading}
            onChange={onChangeHandler}
            value={serviceInfo.category}
            className="flex h-12 w-full rounded-xl border border-primary/10 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none appearance-none disabled:opacity-50"
            required
          >
            <option value="" className="bg-background text-muted-foreground">
              Select category
            </option>
            {MARKETPLACE_CATEGORIES.map((cat: string) => (
              <option
                key={cat}
                value={cat}
                className="bg-background text-foreground"
              >
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

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
