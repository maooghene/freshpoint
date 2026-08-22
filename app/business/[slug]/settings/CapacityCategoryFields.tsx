"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Tags } from "lucide-react";

interface CapacityCategoryFieldsProps {
  business: {
    sittingCapacity: number;
    categories: string[];
  };
  isPending: boolean;
  errors?: {
    sittingCapacity?: string[];
  };
}

export function CapacityCategoryFields({
  business,
  isPending,
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

      <div className="space-y-2">
        <Label
          htmlFor="categories"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Tags className="h-4 w-4 text-muted-foreground/80" /> Categories
        </Label>
        <Input
          id="categories"
          name="categories"
          type="text"
          defaultValue={business.categories.join(", ")}
          placeholder="Barber, Salon"
          disabled={isPending}
          className="bg-background"
        />
      </div>
    </div>
  );
}
