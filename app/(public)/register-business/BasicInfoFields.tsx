"use client";

import * as React from "react";
import { Store, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterState } from "./actions";

interface Props {
  isPending: boolean;
  state: RegisterState;
  slugValue: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BasicInfoFields({
  isPending,
  state,
  slugValue,
  onNameChange,
  onSlugChange,
}: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <Store className="h-4 w-4 text-muted-foreground" />
          {"Shop Name"}
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Freshpoint Salon & Spa"
          onChange={onNameChange}
          disabled={isPending}
          required
          className="rounded-xl"
        />
        {state.errors?.name && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="slug"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <Link2 className="h-4 w-4 text-muted-foreground" />
          {"Your Unique Shop Link"}
        </Label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-xs font-medium text-muted-foreground select-none pointer-events-none">
            {"freshpoint.com/"}
          </span>
          <Input
            id="slug"
            name="slug"
            type="text"
            value={slugValue}
            onChange={onSlugChange}
            placeholder="salon-and-spa"
            disabled={isPending}
            required
            className="pl-[100px] rounded-xl font-mono text-xs"
          />
        </div>
        {state.errors?.slug && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.slug}
          </p>
        )}
      </div>
    </>
  );
}
