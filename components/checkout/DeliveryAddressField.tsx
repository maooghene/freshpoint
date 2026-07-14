"use client";

import { Loader2, MapPin, AlertCircle } from "lucide-react";

interface DeliveryAddressFieldProps {
  address: string;
  onChange: (address: string) => void;
  calculatingFee: boolean;
  estimatedDistance: number;
  fallbackMessage: string | null;
}

export function DeliveryAddressField({
  address,
  onChange,
  calculatingFee,
  estimatedDistance,
  fallbackMessage,
}: DeliveryAddressFieldProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={address}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter complete shipping street address..."
        className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
      />
      {calculatingFee && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Loader2 className="animate-spin w-3 h-3 text-primary" /> Mapping
          route distance metrics...
        </p>
      )}
      {estimatedDistance > 0 && !calculatingFee && (
        <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Estimated Distance: {estimatedDistance}{" "}
          km from storefront workspace.
        </p>
      )}
      {fallbackMessage && !calculatingFee && (
        <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {fallbackMessage}
        </p>
      )}
    </div>
  );
}
