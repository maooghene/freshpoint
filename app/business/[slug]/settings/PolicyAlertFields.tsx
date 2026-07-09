"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, HelpCircle } from "lucide-react";

interface AlertFieldsProps {
  business: {
    emailAlertsActive: boolean;
    customInvoiceNote: string | null;
  };
  isPending: boolean;
}

export function PolicyAlertFields({ business, isPending }: AlertFieldsProps) {
  return (
    <>
      <div className="space-y-3 border-t border-border/60 pt-4">
        <Label className="text-sm font-bold text-foreground">
          Email Notifications
        </Label>
        <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer select-none">
          <input
            type="checkbox"
            name="emailAlertsActive"
            value="true"
            defaultChecked={business.emailAlertsActive}
            disabled={isPending}
            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Mail className="h-4 w-4 text-muted-foreground" /> Automatically
            send confirmation emails to clients
          </div>
        </label>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label
          htmlFor="customInvoiceNote"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground/80" /> Important
          Note for Customers
        </Label>
        <p className="text-xs text-muted-foreground">
          This message will appear on the screen after the client pays and
          confirms their booking.
        </p>
        <Textarea
          id="customInvoiceNote"
          name="customInvoiceNote"
          defaultValue={business.customInvoiceNote || ""}
          placeholder="Example: Please arrive 10 minutes early. Parking is available at the front of the building."
          rows={3}
          disabled={isPending}
          className="bg-background"
        />
      </div>
    </>
  );
}
