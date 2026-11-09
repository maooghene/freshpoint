"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { CategoryPicker, type CategoryOption } from "@/components/CategoryPicker";

interface CapacityCategoryFieldsProps {
  business: {
    sittingCapacity: number;
    categories: string[];
  };
  isPending: boolean;
  categoryOptions: CategoryOption[];
  errors?: {
    sittingCapacity?: string[];
    categories?: string[];
  };
}

export function CapacityCategoryFields({
  business,
  isPending,
  categoryOptions,
  errors,
}: CapacityCategoryFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <Label
          htmlFor="sittingCapacity"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Users className="h-4 w-4 text-muted-foreground/80" /> Capacity
        </Label>
        <Input
          id="sittingCapacity"
          name="sittingCapacity"
          type="number"
          min="1"
          defaultValue={business.sittingCapacity}
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.sittingCapacity && (
          <p className="text-xs font-medium text-destructive animate-pulse">
            {errors.sittingCapacity[0]}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <CategoryPicker
          options={categoryOptions}
          initial={business.categories}
          disabled={isPending}
          error={errors?.categories?.[0]}
          format="comma"
        />
      </div>
    </div>
  );
}
