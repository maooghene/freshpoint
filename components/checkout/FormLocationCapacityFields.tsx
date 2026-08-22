"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Users,
  LocateFixed,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { RegisterState } from "./actions";
import { toast } from "react-toastify";

interface FormLocationCapacityFieldsProps {
  isPending: boolean;
  state: RegisterState;
}

export function FormLocationCapacityFields({
  isPending,
  state,
}: FormLocationCapacityFieldsProps): React.JSX.Element {
  const [latValue, setLatValue] = React.useState<string>("");
  const [lngValue, setLngValue] = React.useState<string>("");
  const [address, setAddress] = React.useState<string>("");
  const [locating, setLocating] = React.useState(false);
  const [locationCaptured, setLocationCaptured] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  // 🚀 FIXED: This used to be a fake "simulate pin drop" that jittered a
  // small random offset around a hardcoded Lagos coordinate (6.5244,
  // 3.3792), regardless of the shop's real location. Every business
  // created through this form ended up with wrong coordinates because of
  // it. Now it captures the owner's actual GPS position via the browser —
  // the owner should tap this while physically standing at their shop.
  const handleCaptureLocation = (): void => {
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support location access.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatValue(position.coords.latitude.toFixed(6));
        setLngValue(position.coords.longitude.toFixed(6));
        setLocationCaptured(true);
        setLocating(false);
        toast.success("Shop location captured!");
      },
      (error) => {
        setLocating(false);
        setLocationCaptured(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location access denied. Enable it in your browser settings to set your shop's exact position — this determines delivery fees for your customers.",
          );
        } else {
          setLocationError("Couldn't get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="space-y-5">
      {/* Hidden coordinates inputs for the backend — empty until the owner
          actually captures a real location, so the server can tell the
          difference between "not set" and a real 0,0 or Lagos default. */}
      <input type="hidden" name="latitude" value={latValue} />
      <input type="hidden" name="longitude" value={lngValue} />

      {/* Physical Address */}
      <div className="space-y-1.5">
        <Label
          htmlFor="address"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {"Shop Address"}
        </Label>
        <Input
          id="address"
          name="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., Felele, Ibadan"
          disabled={isPending}
          required
          className="rounded-xl"
        />
        {state.errors?.address && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.address}
          </p>
        )}
      </div>

      {/* Real GPS capture — replaces the old fake pin-drop simulator */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={handleCaptureLocation}
          disabled={isPending || locating}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary transition-colors disabled:opacity-60 cursor-pointer"
        >
          {locating ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" /> Getting your
              location...
            </>
          ) : locationCaptured ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Shop location captured — tap
              to re-check
            </>
          ) : (
            <>
              <LocateFixed className="w-4 h-4" /> Set Shop Location (stand at
              your shop, then tap this)
            </>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground">
          This sets your exact map position so customer delivery fees are
          calculated correctly. Make sure you&apos;re physically at your shop
          when you tap it.
        </p>
        {locationError && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {locationError}
          </p>
        )}
        {!locationCaptured && !locationError && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
            Required — your shop won&apos;t be created without a captured
            location.
          </p>
        )}
      </div>

      {/* 🚀 LAYMAN-FRIENDLY WORKFORCE CAPACITY INPUT */}
      <div className="space-y-1.5 w-full sm:max-w-[75%]">
        <Label
          htmlFor="sittingCapacity"
          className="flex items-center gap-2 text-slate-900 dark:text-white font-bold"
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          {"Number of Service Chairs / Workers"}
        </Label>
        <Input
          id="sittingCapacity"
          name="sittingCapacity" // 👈 Keeps database compatibility perfectly safe!
          type="number"
          min="1"
          defaultValue="1"
          disabled={isPending}
          required
          className="rounded-xl font-medium"
        />
        {state.errors?.sittingCapacity && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.sittingCapacity}
          </p>
        )}
        <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1 bg-secondary/20 p-3 rounded-xl border border-border/40 whitespace-normal break-words">
          {
            "How many customers can your shop attend to at the exact same time? For example: If you have 4 barbers and 4 styling chairs, type 4. This stops overbooking and prevents long waiting lines."
          }
        </p>
      </div>
    </div>
  );
}
