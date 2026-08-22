"use client";

import { useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StaffMember } from "./types";

interface StaffMemberRowProps {
  member: StaffMember;
  onToggleActive: (id: string, current: boolean) => Promise<void>;
  onUpdateName: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onManageSchedule: (member: StaffMember) => void;
}

export default function StaffMemberRow({
  member,
  onToggleActive,
  onUpdateName,
  onDelete,
  onManageSchedule,
}: StaffMemberRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(member.name);

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim() === member.name) {
      setIsEditing(false);
      return;
    }
    await onUpdateName(member.id, editName.trim());
    setIsEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-all shadow-xs">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0 select-none">
        {member.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {isEditing ? (
          <div className="flex gap-2 max-w-md animate-in fade-in duration-100">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="rounded-xl h-9 text-sm bg-background font-bold"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="p-2 rounded-lg bg-primary/10 text-primary transition cursor-pointer"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-lg bg-muted text-muted-foreground transition cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="font-black text-base text-foreground truncate">
              {member.name}
            </p>
            <span className="bg-primary/5 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-primary/10">
              {member.role || "Specialist"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-xs font-medium text-muted-foreground">
          <Badge
            className={`text-[9px] font-bold px-2 py-0 cursor-default select-none tracking-wide ${
              member.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {member.isActive ? "● Active / Linked" : "● Pending Invite"}
          </Badge>
          <span className="font-mono text-muted-foreground/80">
            {member.user?.email || member.email}
          </span>
          <span className="text-muted-foreground/60">
            {member.schedules?.length || 0} shift schedule
            {member.schedules?.length !== 1 ? "s" : ""} mapped
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 sm:justify-end border-t sm:border-none pt-3 sm:pt-0">
        <button
          onClick={() => onManageSchedule(member)}
          className="p-2 rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition cursor-pointer"
          title="Manage Schedule"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsEditing(true);
            setEditName(member.name);
          }}
          className="p-2 rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition cursor-pointer"
          title="Edit Name"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggleActive(member.id, member.isActive)}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            member.isActive
              ? "border-border bg-background/50 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/5 hover:border-amber-500/30"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
          }`}
          title={member.isActive ? "Deactivate" : "Activate"}
        >
          {member.isActive ? (
            <XIcon className="w-4 h-4" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="p-2 rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30 transition cursor-pointer"
          title="Remove Teammate"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
