// components/checkout/CheckoutContactField.tsx
"use client";

import { PhoneIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CheckoutContactFieldProps {
  value: string;
  onChange: (val: string) => void;
}

export function CheckoutContactField({
  value,
  onChange,
}: CheckoutContactFieldProps) {
  return (
    <div className="space-y-2 animate-in fade-in duration-200">
      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <PhoneIcon className="size-3 text-primary" />
        WhatsApp / Call Contact Number
      </label>
      <Input
        type="tel"
        placeholder="e.g. 08031234567 or +234..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-border bg-card h-11 text-sm font-medium focus-visible:ring-primary"
      />
      <p className="text-[10px] text-muted-foreground font-medium pl-1">
        Required for emergency dispatch riders and location verification.
      </p>
    </div>
  );
}
