// components/admin/settings/operations-tab.tsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Zap } from "lucide-react";

interface OperationsProps {
  allowRegistrations: boolean;
  setAllowRegistrations: (v: boolean) => void;
  instantApproval: boolean;
  setInstantApproval: (v: boolean) => void;
}

export function OperationsTab({
  allowRegistrations,
  setAllowRegistrations,
  instantApproval,
  setInstantApproval,
}: OperationsProps) {
  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          How App Works
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Control how new stores and businesses sign up and get approved.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {/* Toggle 1: Allow Registrations */}
        <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <UserPlus className="h-4 w-4 text-muted-foreground/60" />
                Let New Businesses Sign Up
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                Turn this off to instantly block or freeze all new store
                registrations.
              </p>
            </div>
            <Switch
              checked={allowRegistrations}
              onCheckedChange={setAllowRegistrations}
              className="cursor-pointer shrink-0"
            />
          </div>
        </div>

        {/* Toggle 2: Instant Approval */}
        <div className="group p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border/80 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <Zap className="h-4 w-4 text-muted-foreground/60" />
                Approve Stores Instantly
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                Turn this on to let stores go live immediately. Turn it off if
                you want to review them manually first.
              </p>
            </div>
            <Switch
              checked={instantApproval}
              onCheckedChange={setInstantApproval}
              className="cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
