// components/checkout/CheckoutContactField.tsx
"use client";

import { useState } from "react";
import { PhoneIcon, AlertCircleIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CheckoutContactFieldProps {
  value: string;
  onChange: (val: string) => void;
  variant: "booking" | "order";
}

// Exported so parent checkout pages can validate before allowing payment.
export function isValidNigerianPhone(raw: string): boolean {
  const digitsOnly = raw.replace(/[\s-]/g, "");

  // Local format: 0XXXXXXXXXX (exactly 11 digits, starts with 0)
  if (/^0\d{10}$/.test(digitsOnly)) {
    return true;
  }

  // International format: +234XXXXXXXXXX or 234XXXXXXXXXX (234 + 10 digits)
  if (/^(\+?234)\d{10}$/.test(digitsOnly)) {
    return true;
  }

  return false;
}

const HELPER_TEXT: Record<"booking" | "order", string> = {
  booking: "Required so the business can reach you about your appointment.",
  order: "Required for delivery rider contact and location verification.",
};

export function CheckoutContactField({
  value,
  onChange,
  variant,
}: CheckoutContactFieldProps) {
  const [touched, setTouched] = useState(false);

  const isValid = isValidNigerianPhone(value);
  const showError = touched && value.length > 0 && !isValid;

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
        onBlur={() => setTouched(true)}
        maxLength={14}
        className={`rounded-xl border-border bg-card h-11 text-sm font-medium focus-visible:ring-primary ${
          showError ? "border-destructive focus-visible:ring-destructive" : ""
        }`}
      />
      {showError ? (
        <p className="text-[10px] text-destructive font-medium pl-1 flex items-center gap-1">
          <AlertCircleIcon className="size-3" />
          Enter a valid Nigerian number (11 digits, e.g. 08031234567).
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground font-medium pl-1">
          {HELPER_TEXT[variant]}
        </p>
      )}
    </div>
  );
}
