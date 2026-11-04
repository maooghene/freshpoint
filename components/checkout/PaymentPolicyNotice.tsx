"use client";

import { ShieldAlert } from "lucide-react";

interface PaymentPolicyNoticeProps {
  kind: "booking" | "order";
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}

/**
 * Shown right above the pay button. Customers must tick it before they can
 * pay, so the no-refund rule is stated and agreed to before any money moves.
 */
export function PaymentPolicyNotice({
  kind,
  accepted,
  onChange,
}: PaymentPolicyNoticeProps) {
  const isBooking = kind === "booking";
  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Before you pay</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              You pay the <strong>full amount</strong> now
              {isBooking ? " to confirm your appointment" : " for your order"}.
              There are no extra charges on top; FreshPoint&apos;s fee comes out
              of what the business receives.
            </li>
            <li>
              <strong>All payments are final. There are no refunds once you
              have paid</strong>
              {isBooking
                ? ", including if you miss your appointment. We will email you if you do."
                : "."}{" "}
              Please check {isBooking ? "the service, date and time" : "your items and delivery details"}{" "}
              carefully first.
            </li>
            <li>
              The only exception: if we cannot confirm
              {isBooking
                ? " your booking (for example the slot was just taken)"
                : " your order (for example an item just ran out of stock)"}
              , you are refunded automatically.
            </li>
          </ul>
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs font-semibold text-foreground">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>I understand that payments are final and non-refundable.</span>
      </label>
    </div>
  );
}
