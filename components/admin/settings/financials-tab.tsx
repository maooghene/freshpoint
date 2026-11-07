// components/admin/settings/financials-tab.tsx
import { MasterConfigValues } from "@/lib/actions/admin-settings";
import { Label } from "@/components/ui/label";
import { Percent } from "lucide-react";
import { TIER_COMMISSION_RATES } from "@/lib/subscription-tiers";

export function FinancialsTab({ settings }: { settings: MasterConfigValues }) {
  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          Money Settings
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Company cuts per plan.
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

      {/* Payouts are not automated yet, so these values are kept as they are
          and not shown as controls that would do nothing. */}
      <input
        type="hidden"
        name="payoutHoldingPeriodDays"
        defaultValue={settings.payoutHoldingPeriodDays}
      />
      <input
        type="hidden"
        name="platformPayoutFloor"
        defaultValue={settings.platformPayoutFloor}
      />
      <input
        type="hidden"
        name="absorbPaystackFees"
        value={String(settings.absorbPaystackFees)}
      />
    </div>
  );
}
