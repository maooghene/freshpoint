"use client";

import React, { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Save, User, PhoneCall, ShieldAlert, Loader2 } from "lucide-react";
import { updateStaffPersonalSettings } from "./actions";

interface StaffDataPayload {
  name: string;
  role: string;
  email: string;
}

interface PersonalSettingsFormProps {
  staff: StaffDataPayload;
}

export default function PersonalSettingsForm({
  staff,
}: PersonalSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState<string>(staff.name);
  const [phoneInput, setPhoneInput] = useState<string>("");

  // Normalization logic filtering raw prefixes against corporate Nigerian infrastructure specs
  const normalizeNigerianPhoneNumber = (rawPhone: string): string => {
    let clean = rawPhone.replace(/\D/g, "");

    if (clean.startsWith("234")) {
      clean = "0" + clean.substring(3);
    } else if (clean.startsWith("+234")) {
      clean = "0" + clean.substring(4);
    }

    // Strict structural evaluation validation against active local telco maps
    const ngPhoneRegex = /^(070|080|081|090|091|071|082)\d{8}$/;
    if (!ngPhoneRegex.test(clean)) {
      throw new Error(
        "Phone format failed validation. Use standard Nigerian network parameters.",
      );
    }

    // Convert matching matrix blocks securely into E.164 database standards
    return "+234" + clean.substring(1);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Public display name cannot be blank.");
      return;
    }

    let validatedE164Phone = "";
    if (phoneInput.trim()) {
      try {
        validatedE164Phone = normalizeNigerianPhoneNumber(phoneInput);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Invalid phone parameter alignment.";
        toast.error(msg);
        return;
      }
    }

    startTransition(async () => {
      const result = await updateStaffPersonalSettings({
        name,
        phone: validatedE164Phone,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-lg font-bold text-foreground">
          Personal Workspace Details
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Update your public display identity. System settings are restricted
          exclusively to your merchant manager.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Read-Only Manager Parameter Enforcement Notice Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4 border border-border">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Workforce Security Level
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed">
              Your assigned workspace tier is locked as{" "}
              <span className="font-bold underline text-primary">
                {staff.role}
              </span>
              . Schedule modifications, service pricing bounds, and shift
              allocations can only be updated by the store owner.
            </p>
          </div>
        </div>

        {/* Form Fields Layout Grid */}
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
                className="block w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhoneInput(e.target.value)
                }
                placeholder="0803 123 4567"
                className="block w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          {/* Verified Email Field (Read Only) */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Registered Profile Email (Immutable)
            </label>
            <input
              type="email"
              disabled
              value={staff.email}
              className="block w-full rounded-lg border border-border bg-secondary/40 py-2.5 px-3 text-xs text-muted-foreground select-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Form Mutation Execution Button Container */}
        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all duration-200"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="mr-2 h-3.5 w-3.5" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
