"use client";

import React from "react";
import { UsersIcon } from "lucide-react";

export function EmptyStaffState(): React.JSX.Element {
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/20 animate-in fade-in duration-200">
      <UsersIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
      <h3 className="text-base font-bold text-foreground mb-1">
        No Staff Members Onboarded Yet
      </h3>
      <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed px-4">
        {
          "Click the button above to type an employee&apos;s email address and shoot out your first secure workspace invitation token."
        }
      </p>
    </div>
  );
}
