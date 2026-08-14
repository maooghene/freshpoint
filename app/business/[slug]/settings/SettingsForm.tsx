"use client";

import * as React from "react";
import { useActionState, useRef } from "react";
import type { SubscriptionTier } from "@prisma/client";
import { updateBusinessSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import SettingsImageZone from "./SettingsImageZone";
import { IdentityFields } from "./IdentityFields";
import { CapacityCategoryFields } from "./CapacityCategoryFields";
import { DescriptionField } from "./DescriptionField";
import { OwnerRosterToggle } from "./OwnerRosterToggle"; // 🎯 IMPORT TOGGLE
import { Save, RotateCcw, Truck, Lock } from "lucide-react";
import {
  canCustomizeDeliveryRadius,
  getEffectiveDeliveryRadiusKm,
} from "@/lib/subscription-tiers";

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
    baseDeliveryFee?: string[];
    deliveryFeePerKm?: string[];
    deliveryRadiusKm?: string[];
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
  baseDeliveryFee: number;
  deliveryFeePerKm: number;
  deliveryRadiusKm: number | null;
  subscriptionTier: SubscriptionTier;
  initialOwnerActive: boolean; // 🎯 REGISTER PARAMETER
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

  const handleCancelUndo = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.reset();
      toast.info("Form modifications reverted.");
    }
  };

  const canCustomizeRadius = canCustomizeDeliveryRadius(
    business.subscriptionTier,
  );
  const effectiveRadiusKm = getEffectiveDeliveryRadiusKm(
    business.subscriptionTier,
    business.deliveryRadiusKm,
  );

  const handleLockedRadiusClick = () => {
    toast.info(
      `Your current plan allows deliveries within ${effectiveRadiusKm}km. Upgrade to Pro to expand your reach!`,
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {" "}
      {/* Expanded layout bounding */}
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
        <div className="mb-6 border-b border-border pb-4">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Workspace Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Modify your store&apos;s public profile details displayed to
            consumers across the marketplace ecosystem.
          </p>
        </div>

        <form ref={formRef} action={formAction} className="space-y-6">
          <CapacityCategoryFields
            business={business}
            isPending={isPending}
            errors={state.errors}
          />

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

            <div>
              <label
                htmlFor="deliveryRadiusKm"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Delivery Radius (Km)
              </label>

              {canCustomizeRadius ? (
                <>
                  <input
                    id="deliveryRadiusKm"
                    name="deliveryRadiusKm"
                    type="number"
                    step="0.1"
                    min="0.1"
                    disabled={isPending}
                    defaultValue={business.deliveryRadiusKm ?? ""}
                    placeholder={`Default: ${effectiveRadiusKm}km`}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  />
                  {state.errors?.deliveryRadiusKm && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      {state.errors.deliveryRadiusKm[0]}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Leave blank to use the standard {effectiveRadiusKm}km
                    radius.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLockedRadiusClick}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                  >
                    <span>{effectiveRadiusKm} km (Standard Plan Limit)</span>
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Upgrade to Pro to customize your delivery radius.
                  </p>
                </>
              )}
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
      {/* 🎯 PLACED CLEANLY OUTSIDE FORM BLOCK SO SWITCH CHANGES MUTATE INDEPENDENTLY */}
      <OwnerRosterToggle
        businessId={business.id}
        initialIsActive={business.initialOwnerActive}
      />
    </div>
  );
}
