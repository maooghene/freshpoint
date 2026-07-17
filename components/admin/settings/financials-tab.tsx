// components/admin/settings/financials-tab.tsx
import { MasterConfigValues } from "@/lib/actions/admin-settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarCheck2, ShoppingBag, Clock, Percent } from "lucide-react";
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

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Booking Cut Card */}
        <div className="group flex flex-col justify-between p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
          <div className="space-y-1.5 mb-5">
            <Label
              htmlFor="bookingCommissionPct"
              className="flex items-center gap-2 font-semibold text-sm text-foreground group-focus-within:text-primary transition-colors"
            >
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground/60" />{" "}
              Service Booking Cut
            </Label>
            <p className="text-xs text-muted-foreground leading-normal">
              The percentage FreshPoint takes from every booked service.
            </p>
          </div>
          <div className="relative flex items-center mt-auto">
            <Input
              id="bookingCommissionPct"
              name="bookingCommissionPct"
              type="number"
              defaultValue={settings.bookingCommissionPct}
              required
              className="h-11 font-mono font-medium pl-4 pr-12 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-primary"
            />
            <div className="absolute right-3 px-2 py-1 rounded-md bg-muted border border-border/50 text-[10px] text-muted-foreground font-bold pointer-events-none tracking-wider">
              %
            </div>
          </div>
        </div>

        {/* Storefront Cut Card */}
        <div className="group flex flex-col justify-between p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
          <div className="space-y-1.5 mb-5">
            <Label
              htmlFor="productCommissionPct"
              className="flex items-center gap-2 font-semibold text-sm text-foreground group-focus-within:text-primary transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-muted-foreground/60" />{" "}
              Product Storefront Cut
            </Label>
            <p className="text-xs text-muted-foreground leading-normal">
              The percentage FreshPoint takes from every shop order.
            </p>
          </div>
          <div className="relative flex items-center mt-auto">
            <Input
              id="productCommissionPct"
              name="productCommissionPct"
              type="number"
              defaultValue={settings.productCommissionPct}
              required
              className="h-11 font-mono font-medium pl-4 pr-12 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-primary"
            />
            <div className="absolute right-3 px-2 py-1 rounded-md bg-muted border border-border/50 text-[10px] text-muted-foreground font-bold pointer-events-none tracking-wider">
              %
            </div>
          </div>
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
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
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
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
