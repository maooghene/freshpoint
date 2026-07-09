"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface DescriptionFieldProps {
  business: {
    description: string | null;
  };
  isPending: boolean;
  errors?: {
    description?: string[];
  };
}

export function DescriptionField({
  business,
  isPending,
  errors,
}: DescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="description"
        className="flex items-center gap-2 text-foreground/90 font-medium"
      >
        <FileText className="h-4 w-4 text-muted-foreground/80" /> Business
        Description
      </Label>
      <Textarea
        id="description"
        name="description"
        defaultValue={business.description || ""}
        placeholder="Describe workspace..."
        rows={4}
        disabled={isPending}
        className="bg-background"
      />
      {errors?.description && (
        <p className="text-xs font-medium text-destructive animate-pulse">
          {errors.description[0]}
        </p>
      )}
    </div>
  );
}
