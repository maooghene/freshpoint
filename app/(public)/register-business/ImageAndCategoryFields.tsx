"use client";

import * as React from "react";
import { Image as ImageIcon, Tags } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterState } from "./actions";

const MAX_CATEGORIES = 3;

interface CategoryOption {
  label: string;
  value: string;
}

interface Props {
  isPending: boolean;
  state: RegisterState;
  categories: CategoryOption[]; // ADDED
}

export function ImageAndCategoryFields({
  isPending,
  state,
  categories,
}: Props) {
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggleCategory = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= MAX_CATEGORIES) {
        return prev;
      }
      return [...prev, value];
    });
  };

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
        <Label className="flex items-center gap-2 text-foreground font-bold">
          <Tags className="h-4 w-4 text-muted-foreground" />
          {"Business Categories"}
          <span className="text-[10px] font-medium text-muted-foreground">
            ({selected.length}/{MAX_CATEGORIES} selected)
          </span>
        </Label>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-input bg-background p-3">
          {categories.length === 0 && (
            <p className="col-span-2 text-xs text-muted-foreground py-1">
              {"No categories available yet."}
            </p>
          )}
          {categories.map((cat) => {
            const isChecked = selected.includes(cat.value);
            const isDisabled =
              isPending || (!isChecked && selected.length >= MAX_CATEGORIES);

            return (
              <label
                key={cat.value}
                className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 cursor-pointer ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={cat.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggleCategory(cat.value)}
                  className="h-4 w-4 rounded border-input"
                />
                {cat.label}
              </label>
            );
          })}
        </div>

        {state.errors?.category && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.category}
          </p>
        )}
      </div>
    </>
  );
}
