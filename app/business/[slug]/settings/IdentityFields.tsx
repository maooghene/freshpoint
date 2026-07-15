"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Phone, MapPin } from "lucide-react";

interface IdentityFieldsProps {
  business: {
    name: string;
    phone: string;
    address: string;
  };
  isPending: boolean;
  errors?: {
    name?: string[];
    phone?: string[];
    address?: string[];
  };
}

export function IdentityFields({
  business,
  isPending,
  errors,
}: IdentityFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Store className="h-4 w-4 text-muted-foreground/80" /> Business Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={business.name}
          placeholder="FreshPointStore"
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.name && (
          <p className="text-xs font-medium text-destructive animate-pulse">
            {errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="phone"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Phone className="h-4 w-4 text-muted-foreground/80" /> Business Phone
          Number
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={business.phone}
          placeholder="+234..."
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.phone && (
          <p className="text-xs font-medium text-destructive animate-pulse">
            {errors.phone[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="address"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <MapPin className="h-4 w-4 text-muted-foreground/80" /> Physical
          Street Address
        </Label>
        <Input
          id="address"
          name="address"
          type="text"
          defaultValue={business.address}
          placeholder="Address"
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.address && (
          <p className="text-xs font-medium text-destructive animate-pulse">
            {errors.address[0]}
          </p>
        )}
      </div>
    </>
  );
}
