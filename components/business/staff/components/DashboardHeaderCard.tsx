"use client";

import React from "react";
import { UsersIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffMember } from "../types";

interface DashboardHeaderCardProps {
  staffList: StaffMember[];
  showAddForm: boolean;
  onToggleAddForm: () => void;
}

export function DashboardHeaderCard({
  staffList,
  showAddForm,
  onToggleAddForm,
}: DashboardHeaderCardProps): React.JSX.Element {
  const activeCount = staffList.filter((s) => s.isActive).length;

  return (
    /* Delay the horizontal row transformation to medium screens to prevent small-device layout squishing */
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-border bg-card p-4 rounded-2xl shadow-xs transition-colors duration-200 w-full min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <UsersIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground truncate">
            {staffList.length} Team Member{staffList.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
          <p className="text-xs text-muted-foreground font-medium truncate">
            {activeCount} active workspace profiles
          </p>
        </div>
      </div>
      <Button
        onClick={onToggleAddForm}
        className="rounded-xl font-bold gap-2 cursor-pointer shadow-sm text-xs h-10 px-4 w-full md:w-auto shrink-0"
      >
        <PlusIcon className="w-4 h-4" />
        {showAddForm ? "Close Form" : "Add Teammate"}
      </Button>
    </div>
  );
}
