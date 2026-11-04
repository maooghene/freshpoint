// components/admin/settings/financials-tab.tsx
import { MasterConfigValues } from "@/lib/actions/admin-settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Percent } from "lucide-react";
import { TIER_COMMISSION_RATES } from "@/lib/subscription-tiers";
import * as React from "react";

export function FinancialsTab({ settings }: { settings: MasterConfigValues }) {
  // Controlling the switch local layout state for simple input integration
  const [absorbFees, setAbsorbFees] = React.useState(
    settings.absorbPaystackFees,
  );

  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          Money Settings
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Set up company cuts, percentages, and cash out limits here.
        </p>
      </div>

      {/* Commission is fixed per plan (see lib/subscription-tiers.ts) */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
        <Label className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Percent className="h-4 w-4 text-muted-foreground/60" />
          Commission per plan
        </Label>
        <p className="text-xs text-muted-foreground leading-normal">
          FreshPoint&apos;s cut of every booking and shop order is set by the
          business&apos;s subscription plan. It is fixed in the app, not editable
          here.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(["STARTER", "GROWTH", "PRO"] as const).map((tier) => (
            <div
              key={tier}
              className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tier}
              </p>
              <p className="text-lg font-black font-mono text-foreground">
                {Math.round(TIER_COMMISSION_RATES[tier] * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Delay Floor Card */}
      <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <Label
              htmlFor="payoutHoldingPeriodDays"
              className="flex items-center gap-2 font-semibold text-sm text-foreground group-focus-within:text-primary transition-colors"
            >
              <Clock className="h-4 w-4 text-muted-foreground/60" />
              Payout Holding Delay
            </Label>
            <p className="text-xs text-muted-foreground leading-normal">
              Number of days funds are held in escrow before vendors can
              withdraw them. This protects our balances from fraud or customer
              refund requests.
            </p>
          </div>
          <div className="relative flex items-center w-full sm:w-56 shrink-0">
            <Input
              id="payoutHoldingPeriodDays"
              name="payoutHoldingPeriodDays"
              type="number"
              defaultValue={settings.payoutHoldingPeriodDays}
              required
              className="w-full h-11 font-mono font-semibold pl-4 pr-16 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-primary"
            />
            <div className="absolute right-3 px-2 py-1 rounded-md bg-muted border border-border/50 text-[10px] text-muted-foreground font-bold pointer-events-none tracking-wider">
              DAYS
            </div>
          </div>
        </div>
      </div>

      {/* Minimum Payout Floor Card */}
      <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <Label
              htmlFor="platformPayoutFloor"
              className="font-semibold text-sm text-foreground group-focus-within:text-primary transition-colors"
            >
              Minimum Cash Out Limit
            </Label>
            <p className="text-xs text-muted-foreground leading-normal">
              Sellers cannot take out money if their account balance is less
              than this amount.
            </p>
          </div>
          <div className="relative flex items-center w-full sm:w-56 shrink-0">
            <span className="absolute left-3.5 text-sm font-semibold text-muted-foreground/80 pointer-events-none select-none">
              ₦
            </span>
            <Input
              id="platformPayoutFloor"
              name="platformPayoutFloor"
              type="number"
              defaultValue={settings.platformPayoutFloor}
              required
              className="w-full h-11 font-mono font-semibold pl-9 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Absorb Fees Toggle Card */}
      <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Percent className="h-4 w-4 text-muted-foreground/60" />
              Absorb Payment Fees
            </Label>
            <p className="text-xs text-muted-foreground leading-normal">
              Turn this on if FreshPoint pays for Paystack transaction fees.
              Turn this off to automatically subtract card processing fees from
              the vendor&apos;s total payout earnings.
            </p>
          </div>
          {/* Hidden text input field maps state safely into form data collections */}
          <input
            type="hidden"
            name="absorbPaystackFees"
            value={absorbFees ? "true" : "false"}
          />
          <Switch
            checked={absorbFees}
            onCheckedChange={setAbsorbFees}
            className="cursor-pointer shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
