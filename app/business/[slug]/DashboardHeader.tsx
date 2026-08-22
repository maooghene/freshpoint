import * as React from "react";

interface DashboardHeaderProps {
  ownerName: string;
}

export default function DashboardHeader({ ownerName }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground truncate whitespace-normal break-words leading-relaxed">
        Welcome back{ownerName}
      </h1>
      <p className="text-muted-foreground text-sm font-medium truncate whitespace-normal break-words leading-relaxed">
        Monitor real-time analytics indicators, revenue yields, and active
        staff.
      </p>
    </div>
  );
}
