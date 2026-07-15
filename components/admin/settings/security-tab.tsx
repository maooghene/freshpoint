// components/admin/settings/security-tab.tsx
import { MasterConfigValues } from "@/lib/actions/admin-settings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Gauge } from "lucide-react";

interface SecurityProps {
  settings: MasterConfigValues;
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
}

export function SecurityTab({
  settings,
  maintenanceMode,
  setMaintenanceMode,
}: SecurityProps) {
  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-destructive sm:text-2xl">
          Safety Gates
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Emergency buttons to lock down the app or stop spam. Use these
          carefully.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {/* Toggle Card: Close App */}
        <div className="group p-5 rounded-2xl border border-destructive/20 bg-destructive/[0.02] shadow-sm hover:border-destructive/30 transition-all duration-200">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <Label className="flex items-center gap-2 font-semibold text-sm text-destructive">
                <ShieldAlert className="h-4 w-4" />
                Close App for Fixes
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                Turn this on to stop everyone from using the app right away.
                Users will see a screen saying the app is under repair.
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              className="cursor-pointer data-[state=checked]:bg-destructive"
            />
          </div>
        </div>

        {/* Input Card: Max Bookings */}
        <div className="group p-5 rounded-2xl border border-destructive/20 bg-destructive/[0.02] shadow-sm hover:border-destructive/30 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <Label
                htmlFor="maxDailyBookingsPerUser"
                className="flex items-center gap-2 font-semibold text-sm text-destructive"
              >
                <Gauge className="h-4 w-4" />
                Max Daily Bookings Per User
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                The absolute highest number of bookings one single user can make
                in one single day. This stops spammers.
              </p>
            </div>
            <div className="w-full sm:w-32 shrink-0">
              <Input
                id="maxDailyBookingsPerUser"
                name="maxDailyBookingsPerUser"
                type="number"
                defaultValue={settings.maxDailyBookingsPerUser}
                required
                className="w-full h-11 font-mono font-semibold px-4 bg-muted/40 border-border/80 rounded-xl focus:bg-background focus:ring-1 focus:ring-destructive focus:border-destructive"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
