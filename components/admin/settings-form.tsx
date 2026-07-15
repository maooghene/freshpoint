// components/admin/settings-form.tsx
"use client";

import { useTransition, useState, useEffect } from "react";
import {
  MasterConfigValues,
  updateSystemSettingsAction,
} from "@/lib/actions/admin-settings";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  ShieldAlert,
  Truck,
  Sliders,
  Check,
  Loader2,
} from "lucide-react";

import { FinancialsTab } from "./settings/financials-tab";
import { OperationsTab } from "./settings/operations-tab";
import { LogisticsTab } from "./settings/logistics-tab";
import { SecurityTab } from "./settings/security-tab";

interface SettingsFormProps {
  initialSettings: MasterConfigValues;
}

type SectionKey = "finance" | "ops" | "logistics" | "security";

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<SectionKey>("finance");

  const [maintenanceMode, setMaintenanceMode] = useState(
    initialSettings.maintenanceModeActive,
  );
  const [allowRegistrations, setAllowRegistrations] = useState(
    initialSettings.allowNewRegistrations,
  );
  const [instantApproval, setInstantApproval] = useState(
    initialSettings.enforceInstantApproval,
  );

  // Goes back to the top of the box when you switch pages
  useEffect(() => {
    const container = document.getElementById("settings-scroll-content");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSection]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload: MasterConfigValues = {
      bookingCommissionPct: parseInt(
        formData.get("bookingCommissionPct") as string,
        10,
      ),
      productCommissionPct: parseInt(
        formData.get("productCommissionPct") as string,
        10,
      ),
      minGlobalDeliveryFee: parseFloat(
        formData.get("minGlobalDeliveryFee") as string,
      ),
      platformPayoutFloor: parseFloat(
        formData.get("platformPayoutFloor") as string,
      ),
      maintenanceModeActive: maintenanceMode,
      allowNewRegistrations: allowRegistrations,
      enforceInstantApproval: instantApproval,
      maxDailyBookingsPerUser: parseInt(
        formData.get("maxDailyBookingsPerUser") as string,
        10,
      ),
      maxDistanceLimitKm: parseFloat(
        formData.get("maxDistanceLimitKm") as string,
      ),
    };

    startTransition(async () => {
      const response = await updateSystemSettingsAction(payload);
      alert(response.message);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden"
    >
      {/* SCROLLABLE SETTINGS CONTENT */}
      <div
        id="settings-scroll-content"
        className="flex-1 overflow-y-auto no-scrollbar pb-6"
      >
        {/* STICKY TOP MENU */}
        <div className="sticky top-0 z-30 w-full py-3 bg-background border-b border-border/40 mb-6">
          <div className="w-full bg-muted/60 p-1 rounded-2xl border border-border/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveSection("finance")}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                activeSection === "finance"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <Landmark
                className={`h-3.5 w-3.5 ${activeSection === "finance" ? "text-primary" : ""}`}
              />
              Money Settings
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("ops")}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                activeSection === "ops"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <Sliders
                className={`h-3.5 w-3.5 ${activeSection === "ops" ? "text-primary" : ""}`}
              />
              How App Works
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("logistics")}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                activeSection === "logistics"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <Truck
                className={`h-3.5 w-3.5 ${activeSection === "logistics" ? "text-primary" : ""}`}
              />
              Deliveries
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("security")}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                activeSection === "security"
                  ? "bg-destructive/10 text-destructive"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Safety & Security
            </button>
          </div>
        </div>

        {/* ACTIVE SECTION SHOWING HERE */}
        <div className="px-1 animate-in fade-in-40 slide-in-from-bottom-2 duration-300">
          {activeSection === "finance" && (
            <FinancialsTab settings={initialSettings} />
          )}
          {activeSection === "ops" && (
            <OperationsTab
              allowRegistrations={allowRegistrations}
              setAllowRegistrations={setAllowRegistrations}
              instantApproval={instantApproval}
              setInstantApproval={setInstantApproval}
            />
          )}
          {activeSection === "logistics" && (
            <LogisticsTab settings={initialSettings} />
          )}
          {activeSection === "security" && (
            <SecurityTab
              settings={initialSettings}
              maintenanceMode={maintenanceMode}
              setMaintenanceMode={setMaintenanceMode}
            />
          )}
        </div>
      </div>

      {/* SOLID BOTTOM BUTTON BAR */}
      <div className="w-full bg-background border-t border-border pt-4 pb-2 z-40 shrink-0">
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="hidden sm:block text-xs font-medium text-muted-foreground/80">
            Warning: Clicking save will change these settings for the whole app
            immediately.
          </p>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md px-6 rounded-xl h-11 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Save App Settings</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
