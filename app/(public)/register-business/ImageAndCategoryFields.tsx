"use client";

import * as React from "react";
import { Image as ImageIcon, Tags } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterState } from "./actions";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

interface Props {
  isPending: boolean;
  state: RegisterState;
}

export function ImageAndCategoryFields({ isPending, state }: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <Label
          htmlFor="image"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          {"Storefront Cover Image"}
        </Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isPending}
          className="rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary file:cursor-pointer hover:file:bg-primary/20 text-xs"
        />
        {state.errors?.image && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.image}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground font-medium">
          {"Supported dimensions: JPEG, PNG, or WebP. Maximum allocation: 5MB."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="category"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <Tags className="h-4 w-4 text-muted-foreground" />
          {"Business Category"}
        </Label>
        <select
          id="category"
          name="category"
          disabled={isPending}
          required
          defaultValue=""
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm h-10"
        >
          <option value="" disabled>
            Select a category
          </option>
          {BUSINESS_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {state.errors?.category && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.category}
          </p>
        )}
      </div>
    </>
  );
}
