// components/admin/settings/logistics-tab.tsx
import { MasterConfigValues } from "@/lib/actions/admin-settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, MapPin } from "lucide-react";

export function LogisticsTab({ settings }: { settings: MasterConfigValues }) {
  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          Deliveries
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Set up delivery prices and how far your drivers can travel.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {/* Minimum Delivery Fee Card */}
        <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <Label
                htmlFor="minGlobalDeliveryFee"
                className="flex items-center gap-2 font-semibold text-sm text-foreground group-focus-within:text-primary transition-colors"
              >
                <Truck className="h-4 w-4 text-muted-foreground/60" />
                Lowest Delivery Fee
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                The minimum price charged for any delivery, no matter how close
                it is.
              </p>
            </div>
            <div className="relative flex items-center w-full sm:w-56 shrink-0">
              <span className="absolute left-3.5 text-sm font-semibold text-muted-foreground/80 pointer-events-none select-none">
                ₦
              </span>
              <Input
                id="minGlobalDeliveryFee"
                name="minGlobalDeliveryFee"
                type="number"
                defaultValue={settings.minGlobalDeliveryFee}
                required
                className="w-full h-11 font-mono font-semibold pl-9 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Maximum Delivery Distance Card */}
        <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <Label
                htmlFor="maxDistanceLimitKm"
                className="flex items-center gap-2 font-semibold text-sm text-foreground group-focus-within:text-primary transition-colors"
              >
                <MapPin className="h-4 w-4 text-muted-foreground/60" />
                Farthest Delivery Distance
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                Customers who live further away than this number cannot place an
                order.
              </p>
            </div>
            <div className="relative flex items-center w-full sm:w-56 shrink-0">
              <Input
                id="maxDistanceLimitKm"
                name="maxDistanceLimitKm"
                type="number"
                step="0.1"
                defaultValue={settings.maxDistanceLimitKm}
                required
                className="w-full h-11 font-mono font-semibold pl-4 pr-12 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-primary"
              />
              <div className="absolute right-3 px-2 py-1 rounded-md bg-muted border border-border/50 text-[10px] text-muted-foreground font-bold pointer-events-none tracking-wider">
                KM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
