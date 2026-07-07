"use client";

import * as React from "react";
import { useActionState } from "react";
import { updateBusinessSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import {
  Save,
  Store,
  Phone,
  MapPin,
  Image as ImageIcon,
  Users,
  Tags,
  FileText,
} from "lucide-react";

interface ActionState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    phone?: string[];
    address?: string[];
    sittingCapacity?: string[];
    categories?: string[];
    description?: string[];
    image?: string[];
  };
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  sittingCapacity: number;
  categories: string[];
  description: string | null;
  image: string | null;
}

interface SettingsFormProps {
  business: BusinessData;
}

export function SettingsForm({ business }: SettingsFormProps) {
  const boundAction = updateBusinessSettings.bind(
    null,
    business.id,
    business.slug,
  );

  const initialState: ActionState = { success: false, message: "" };

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    initialState,
  );

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    /* 💡 FIXED THEME TOKENS: Replaced hardcoded white sheets with adaptive semantic classes */
    <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          Workspace Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Modify your store&apos;s public profile details displayed to consumers
          across the marketplace ecosystem.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Business Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <Store className="h-4 w-4 text-muted-foreground/80" />
            Business Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={business.name}
            placeholder="Freshpoint Store"
            disabled={isPending}
            required
            className="bg-background text-foreground border-input focus-visible:ring-primary"
          />
          {state.errors?.name && (
            <p className="text-xs font-medium text-destructive animate-pulse">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Telephone Parameter */}
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <Phone className="h-4 w-4 text-muted-foreground/80" />
            Business Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={business.phone}
            placeholder="+1 (555) 000-0000"
            disabled={isPending}
            required
            className="bg-background text-foreground border-input focus-visible:ring-primary"
          />
          {state.errors?.phone && (
            <p className="text-xs font-medium text-destructive animate-pulse">
              {state.errors.phone[0]}
            </p>
          )}
        </div>

        {/* Corporate Physical Location Address */}
        <div className="space-y-2">
          <Label
            htmlFor="address"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <MapPin className="h-4 w-4 text-muted-foreground/80" />
            Physical Street Address
          </Label>
          <Input
            id="address"
            name="address"
            type="text"
            defaultValue={business.address}
            placeholder="123 Marketplace Way, Suite 100"
            disabled={isPending}
            required
            className="bg-background text-foreground border-input focus-visible:ring-primary"
          />
          {state.errors?.address && (
            <p className="text-xs font-medium text-destructive animate-pulse">
              {state.errors.address[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Sitting Capacity Validation Field */}
          <div className="space-y-2">
            <Label
              htmlFor="sittingCapacity"
              className="flex items-center gap-2 text-foreground/90 font-medium"
            >
              <Users className="h-4 w-4 text-muted-foreground/80" />
              Serving/Sitting Capacity
            </Label>
            <Input
              id="sittingCapacity"
              name="sittingCapacity"
              type="number"
              min="1"
              defaultValue={business.sittingCapacity}
              disabled={isPending}
              required
              className="bg-background text-foreground border-input focus-visible:ring-primary"
            />
            {state.errors?.sittingCapacity && (
              <p className="text-xs font-medium text-destructive animate-pulse">
                {state.errors.sittingCapacity[0]}
              </p>
            )}
          </div>

          {/* Tag Category Splitting Array Field */}
          <div className="space-y-2">
            <Label
              htmlFor="categories"
              className="flex items-center gap-2 text-foreground/90 font-medium"
            >
              <Tags className="h-4 w-4 text-muted-foreground/80" />
              Categories (Comma-separated)
            </Label>
            <Input
              id="categories"
              name="categories"
              type="text"
              defaultValue={business.categories.join(", ")}
              placeholder="Barber, Salon, Spa"
              disabled={isPending}
              className="bg-background text-foreground border-input focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Profile Image Asset Field */}
        <div className="space-y-2">
          <Label
            htmlFor="image"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <ImageIcon className="h-4 w-4 text-muted-foreground/80" />
            Profile Image URL
          </Label>
          <Input
            id="image"
            name="image"
            type="url"
            defaultValue={business.image || ""}
            placeholder="https://freshpoint.com"
            disabled={isPending}
            className="bg-background text-foreground border-input focus-visible:ring-primary"
          />
        </div>

        {/* Markdown/Text Description Block */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="flex items-center gap-2 text-foreground/90 font-medium"
          >
            <FileText className="h-4 w-4 text-muted-foreground/80" />
            Business Description
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={business.description || ""}
            placeholder="Describe your workspace offerings..."
            rows={4}
            disabled={isPending}
            className="bg-background text-foreground border-input focus-visible:ring-primary min-h-24 resize-y"
          />
        </div>

        {/* Mutation Submission Interface */}
        <div className="flex items-center justify-end pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving Records..." : "Save Modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}
