"use client";

import * as React from "react";
import { useActionState, useRef, useState } from "react";
import type { SubscriptionTier } from "@prisma/client";
import { createLocation, type LocationActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { MapPin, Lock, Plus, Crosshair, Star } from "lucide-react";
import { canAddLocation } from "@/lib/subscription-tiers";

interface BusinessData {
  id: string;
  slug: string;
  subscriptionTier: SubscriptionTier;
}

interface LocationData {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface LocationsManagerProps {
  business: BusinessData;
  locations: LocationData[];
}

export function LocationsManager({
  business,
  locations,
}: LocationsManagerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);

  const boundAction = createLocation.bind(null, business.id, business.slug);
  const initialState: LocationActionState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState<
    LocationActionState,
    FormData
  >(boundAction, initialState);

  const canAdd = canAddLocation(business.subscriptionTier, locations.length);

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        formRef.current?.reset();
        setCoords(null);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleLockedAddClick = () => {
    toast.info(
      "Adding another location requires the Pro plan. Upgrade to manage multiple branches.",
    );
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location access.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        toast.success("Location captured.");
      },
      () => {
        setIsLocating(false);
        toast.error(
          "Couldn't access your location. Please allow location access and try again.",
        );
      },
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Existing locations list */}
      <div className="grid gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="rounded-xl border border-border bg-card p-4 shadow-xs text-card-foreground flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="rounded-lg bg-muted border border-border p-2 shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {loc.name}
                  </h3>
                  {loc.isPrimary && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-900">
                      <Star className="h-2.5 w-2.5" />
                      Primary
                    </span>
                  )}
                  {!loc.isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {loc.address}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Delivery radius:{" "}
                  {loc.deliveryRadiusKm != null
                    ? `${loc.deliveryRadiusKm}km (custom)`
                    : "Standard plan default"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add location form */}
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
        <div className="mb-6 border-b border-border pb-4">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Add a Location
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {canAdd
              ? "Add another branch customers can book or order from."
              : "Your current plan supports one location."}
          </p>
        </div>

        {canAdd ? (
          <form ref={formRef} action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Location Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                disabled={isPending}
                placeholder="e.g. Abuja Branch"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {state.errors?.name && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {state.errors.name[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                disabled={isPending}
                placeholder="Street, city, state"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {state.errors?.address && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {state.errors.address[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Coordinates
              </label>
              <input type="hidden" name="latitude" value={coords?.lat ?? ""} />
              <input type="hidden" name="longitude" value={coords?.lng ?? ""} />
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={isPending || isLocating}
                className="w-full h-10 px-3 rounded-lg border border-input bg-muted/50 text-sm text-foreground flex items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Crosshair className="h-3.5 w-3.5" />
                {isLocating
                  ? "Getting your location..."
                  : coords
                    ? `Captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
                    : "Use my current location"}
              </button>
              {(state.errors?.latitude || state.errors?.longitude) && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {state.errors.latitude?.[0] || state.errors.longitude?.[0]}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Stand at the branch (or its address) when capturing, for
                accurate delivery-radius calculations.
              </p>
            </div>

            <div>
              <label
                htmlFor="deliveryRadiusKm"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Delivery Radius (Km)
              </label>
              <input
                id="deliveryRadiusKm"
                name="deliveryRadiusKm"
                type="number"
                step="0.1"
                min="0.1"
                disabled={isPending}
                placeholder="Leave blank for standard default"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {state.errors?.deliveryRadiusKm && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {state.errors.deliveryRadiusKm[0]}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl px-4 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {isPending ? "Adding..." : "Add Location"}
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={handleLockedAddClick}
            className="w-full h-10 px-3 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
          >
            <span>Add another location (Pro plan required)</span>
            <Lock className="h-3.5 w-3.5 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
