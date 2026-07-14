"use client";

import * as React from "react";
import { useActionState, useRef } from "react";
import { updateBusinessSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import SettingsImageZone from "./SettingsImageZone";
import { IdentityFields } from "./IdentityFields";
import { CapacityCategoryFields } from "./CapacityCategoryFields";
import { DescriptionField } from "./DescriptionField";
import { Save, RotateCcw, Truck } from "lucide-react";

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
    baseDeliveryFee?: string[]; // New parameter track
    deliveryFeePerKm?: string[]; // New parameter track
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
  baseDeliveryFee: number; // New layout definition
  deliveryFeePerKm: number; // New layout definition
}

interface SettingsFormProps {
  business: BusinessData;
}

export function SettingsForm({ business }: SettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

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

  // Clears and resets input values back to original properties
  const handleCancelUndo = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.reset();
      toast.info("Form modifications reverted.");
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          Workspace Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {
            "Modify your store's public profile details displayed to consumers across the marketplace ecosystem."
          }
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-6">
        <IdentityFields
          business={business}
          isPending={isPending}
          errors={state.errors}
        />

        <CapacityCategoryFields
          business={business}
          isPending={isPending}
          errors={state.errors}
        />

        {/* New Delivery Configuration Section */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-medium pb-2 border-b border-border/60">
            <Truck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold tracking-tight">
              Delivery Pricing Model
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="baseDeliveryFee"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Base Delivery Fee (₦)
              </label>
              <input
                id="baseDeliveryFee"
                name="baseDeliveryFee"
                type="number"
                step="0.01"
                min="0"
                disabled={isPending}
                defaultValue={business.baseDeliveryFee ?? 0}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {state.errors?.baseDeliveryFee && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {state.errors.baseDeliveryFee[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="deliveryFeePerKm"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Fee Per Kilometer (₦/Km)
              </label>
              <input
                id="deliveryFeePerKm"
                name="deliveryFeePerKm"
                type="number"
                step="0.01"
                min="0"
                disabled={isPending}
                defaultValue={business.deliveryFeePerKm ?? 0}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {state.errors?.deliveryFeePerKm && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {state.errors.deliveryFeePerKm[0]}
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Fees calculate automatically on checkout using straight-line maps:{" "}
            <span className="font-medium text-foreground">
              Base + (Rate × Distance)
            </span>
            .
          </p>
        </div>

        <SettingsImageZone
          initialImage={business.image}
          isPending={isPending}
          error={state.errors?.image}
        />

        <DescriptionField
          business={business}
          isPending={isPending}
          errors={state.errors}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancelUndo}
            className="flex items-center gap-2 border-border text-foreground font-semibold h-10 rounded-xl px-4 cursor-pointer hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> Cancel Changes
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl px-4 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving Records..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
