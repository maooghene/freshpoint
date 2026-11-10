"use client";

import * as React from "react";
import { CheckCircle2, LocateFixed, Loader2, MapPin, TriangleAlert } from "lucide-react";
import { toast } from "@/lib/toast";
import { isDefaultLocation } from "@/lib/coordinates";

interface ShopLocationFieldProps {
  latitude: number;
  longitude: number;
  isPending: boolean;
}

/**
 * Sets the shop's exact map position. Delivery distance and fees are measured
 * from it, so the owner should tap the button while standing at the shop.
 * The values ride along with the form as hidden inputs and save with it.
 */
export function ShopLocationField({
  latitude,
  longitude,
  isPending,
}: ShopLocationFieldProps) {
  const [coords, setCoords] = React.useState({ latitude, longitude });
  const [locating, setLocating] = React.useState(false);
  const [changed, setChanged] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const notSet = isDefaultLocation(coords) && !changed;

  const capture = () => {
    if (!("geolocation" in navigator)) {
      setError("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        setChanged(true);
        setLocating(false);
        toast.success("Location captured. Press Save to keep it.");
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Allow it in your browser settings, then try again."
            : "Couldn't get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
      <input type="hidden" name="latitude" value={coords.latitude} />
      <input type="hidden" name="longitude" value={coords.longitude} />

      <div className="flex items-center gap-2 font-medium text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Shop location on the map
      </div>

      {notSet ? (
        <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Your shop location hasn&apos;t been set. Delivery fees are being
          measured from central Lagos until you set it.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)} ·{" "}
          <a
            href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Check on map
          </a>
        </p>
      )}

      <button
        type="button"
        onClick={capture}
        disabled={isPending || locating}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60 cursor-pointer"
      >
        {locating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Getting your location...
          </>
        ) : changed ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Captured. Tap to re-check
          </>
        ) : (
          <>
            <LocateFixed className="h-4 w-4" /> Use my current location
          </>
        )}
      </button>
      <p className="text-[11px] text-muted-foreground">
        Stand at your shop when you tap this. It decides how far customers are
        from you, and so their delivery fee.
      </p>
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}
