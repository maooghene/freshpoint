"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Phone } from "lucide-react";
import type { RegisterState } from "./actions";

interface FormContactFieldsProps {
  isPending: boolean;
  state: RegisterState;
}

export function FormContactFields({
  isPending,
  state,
}: FormContactFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Public Work Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="email"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <Mail className="h-4 w-4 text-muted-foreground" />
          Business Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="contact@brand.com"
          disabled={isPending}
          required
          className="rounded-xl"
        />
        {state.errors?.email && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.email}
          </p>
        )}
      </div>

      {/* Business Phone Number - Configured with standard Nigerian placeholder formatting guidelines */}
      <div className="space-y-1.5">
        <Label
          htmlFor="phone"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <Phone className="h-4 w-4 text-muted-foreground" />
          Store Phone
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="08031234567"
          disabled={isPending}
          required
          className="rounded-xl"
        />
        {state.errors?.phone && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.phone}
          </p>
        )}
      </div>
    </div>
  );
}
