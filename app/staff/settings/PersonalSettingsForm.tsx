"use client";

import React, { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Save, Loader2 } from "lucide-react";
import { updateStaffPersonalSettings } from "./actions";
import { normalizeToE164 } from "@/lib/telecom-helpers";
import { SecurityNoticeBanner } from "./components/SecurityNoticeBanner";
import { IdentityInputGrid } from "./components/IdentityInputGrid";

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
  const [e164Value, setE164Value] = useState<string>("");
  const [isValidNumber, setIsValidNumber] = useState<boolean>(true);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setPhoneInput(rawVal);

    if (!rawVal.trim()) {
      setE164Value("");
      setIsValidNumber(true);
      return;
    }

    const { normalized, isValid } = normalizeToE164(rawVal);
    setE164Value(normalized);
    setIsValidNumber(isValid);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Public display name cannot be blank.");
      return;
    }

    let finalPayloadPhone = "";
    if (phoneInput.trim()) {
      if (!isValidNumber) {
        toast.error(
          "Phone layout check failed. Please supply a valid Nigerian network parameter.",
        );
        return;
      }
      finalPayloadPhone = "+" + e164Value;
    }

    startTransition(async () => {
      const result = await updateStaffPersonalSettings({
        name,
        phone: finalPayloadPhone,
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
        <SecurityNoticeBanner role={staff.role} />

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
