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
    <div className="flex items-center justify-between border border-border bg-card p-4 rounded-2xl shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">
            {staffList.length} Team Member{staffList.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {activeCount} active workspace profiles
          </p>
        </div>
      </div>
      <Button
        onClick={onToggleAddForm}
        className="rounded-xl font-bold gap-2 cursor-pointer shadow-sm text-xs h-10 px-4"
      >
        <PlusIcon className="w-4 h-4" />
        {showAddForm ? "Close Form" : "Add Teammate"}
      </Button>
    </div>
  );
}
