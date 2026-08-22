"use client";

import * as React from "react";
import { User, PhoneCall, ShieldCheck, AlertCircle } from "lucide-react";

interface IdentityInputGridProps {
  name: string;
  setName: (val: string) => void;
  phoneInput: string;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isValidNumber: boolean;
  e164Value: string;
  email: string;
}

export function IdentityInputGrid({
  name,
  setName,
  phoneInput,
  handlePhoneChange,
  isValidNumber,
  e164Value,
  email,
}: IdentityInputGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Display Name Input */}
      <div className="space-y-2">
        <label
          htmlFor="staffName"
          className="block text-xs font-bold text-muted-foreground uppercase tracking-wide"
        >
          Public Display Name
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <User className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <input
            type="text"
            id="staffName"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            required
            placeholder="John Doe"
            className="block w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      {/* Contact Notification Input */}
      <div className="space-y-2">
        <label
          htmlFor="staffPhone"
          className="block text-xs font-bold text-muted-foreground uppercase tracking-wide"
        >
          Notification Phone Profile
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <PhoneCall className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <input
            type="tel"
            id="staffPhone"
            value={phoneInput}
            onChange={handlePhoneChange}
            placeholder="0803 123 4567"
            className="block w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>
        {phoneInput && (
          <div className="text-[10px] font-semibold flex items-center gap-1 mt-1">
            {isValidNumber ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Standard E.164: +{e164Value}
              </span>
            ) : (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Invalid local telco network assignment.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Verified Email Field (Read Only) */}
      <div className="space-y-2 sm:col-span-2">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Registered Profile Email (Immutable)
        </label>
        <input
          type="email"
          disabled
          value={email}
          className="block w-full rounded-lg border border-border bg-secondary/40 py-2.5 px-3 text-xs text-muted-foreground select-none cursor-not-allowed"
        />
      </div>
    </div>
  );
}
