"use client";

import * as React from "react";
import { useActionState, useRef, useEffect } from "react";
import { updateBusinessPolicies, PolicyActionState } from "./policyActions";
import { PolicyTimingFields } from "./PolicyTimingFields";
import { PolicyRegionFields } from "./PolicyRegionFields";
import { PolicyAlertFields } from "./PolicyAlertFields";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Save, RotateCcw } from "lucide-react";

interface PolicyFormProps {
  business: {
    id: string;
    slug: string;
    minNoticeHours: number;
    maxAheadDays: number;
    cancelWindowHours: number;
    bufferTimeMinutes: number;
    timezone: string;
    currencyCode: string;
    emailAlertsActive: boolean;
    customInvoiceNote: string | null;
  };
}

export function BookingPolicyForm({ business }: PolicyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = updateBusinessPolicies.bind(
    null,
    business.id,
    business.slug,
  );
  const initialState: PolicyActionState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleCancelUndo = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.reset();
      toast.info("Settings reverted to original values.");
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          Booking Rules & Preferences
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {"Set up how and when customers can book appointments at your shop."}
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-6">
        <PolicyTimingFields business={business} isPending={isPending} />

        <PolicyRegionFields business={business} isPending={isPending} />

        <PolicyAlertFields business={business} isPending={isPending} />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancelUndo}
            className="flex items-center gap-2 border-border text-foreground font-semibold h-10 rounded-xl px-4 cursor-pointer hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> Reset Form
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl px-4 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
