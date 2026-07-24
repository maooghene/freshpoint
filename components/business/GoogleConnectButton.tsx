"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleConnectButtonProps {
  businessId: string;
}

export default function GoogleConnectButton({
  businessId,
}: GoogleConnectButtonProps) {
  const searchParams = useSearchParams();
  const [syncStatus, setSyncStatus] = useState<"IDLE" | "SUCCESS" | "LOADING">(
    "IDLE",
  );

  useEffect(() => {
    // Catch the callback query string variable we generated in the callback route
    if (searchParams.get("google_sync") === "success") {
      setSyncStatus("SUCCESS");
    }
  }, [searchParams]);

  const handleConnect = () => {
    setSyncStatus("LOADING");
    // Standard secure window redirect right into our initializer API endpoint
    window.location.href = `/api/businesses/auth/google?businessId=${businessId}`;
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
          <Calendar size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Google Calendar Integration
          </h4>
          <p className="text-xs text-muted-foreground font-medium">
            Sync newly confirmed booking client sessions straight to your
            calendar dashboard feeds.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-xs font-semibold text-muted-foreground">
          {syncStatus === "SUCCESS"
            ? "Integration Status: Connected"
            : "Integration Status: Disconnected"}
        </span>

        {syncStatus === "SUCCESS" ? (
          <Button
            type="button"
            disabled
            className="rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5 h-9"
          >
            <CheckCircle2 size={15} />
            Linked Perfectly
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleConnect}
            disabled={syncStatus === "LOADING"}
            className="rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm flex items-center gap-1.5 h-9 cursor-pointer"
          >
            {syncStatus === "LOADING" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Calendar"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
