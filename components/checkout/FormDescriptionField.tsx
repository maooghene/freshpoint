"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface FormDescriptionFieldProps {
  isPending: boolean;
}

export function FormDescriptionField({ isPending }: FormDescriptionFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor="description"
        className="flex items-center gap-2 text-foreground font-bold"
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        Short Brand Description
      </Label>
      <Textarea
        id="description"
        name="description"
        placeholder="Describe your workspace offerings, specialties, and client workflow details..."
        rows={3}
        disabled={isPending}
        className="rounded-xl resize-none"
      />
    </div>
  );
}
