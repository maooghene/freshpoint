"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Crosshair } from "lucide-react";
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
  const [latValue, setLatValue] = React.useState<string>("6.5244");
  const [lngValue, setLngValue] = React.useState<string>("3.3792");
  const [address, setAddress] = React.useState<string>("");

  const handleSimulatePinDrop = (): void => {
    const randomOffsetLat = (Math.random() - 0.5) * 0.04;
    const randomOffsetLng = (Math.random() - 0.5) * 0.04;
    const computedLat = (6.5244 + randomOffsetLat).toFixed(6);
    const computedLng = (3.3792 + randomOffsetLng).toFixed(6);

    setLatValue(computedLat);
    setLngValue(computedLng);
    toast.info("Map drop pin coordinates attached cleanly!");
  };

  return (
    <div className="space-y-5">
      {/* Hidden coordinates inputs for the backend */}
      <input type="hidden" name="latitude" value={latValue} />
      <input type="hidden" name="longitude" value={lngValue} />

      {/* Physical Address */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="address"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {"Shop Address"}
          </Label>
          <button
            type="button"
            onClick={handleSimulatePinDrop}
            disabled={isPending}
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0"
          >
            <Crosshair className="h-3 w-3" />
            {"Locate on Map"}
          </button>
        </div>
        <Input
          id="address"
          name="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., 123 Corporate Way, Ikeja, Lagos"
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
