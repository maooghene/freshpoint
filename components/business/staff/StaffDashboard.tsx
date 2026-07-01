// components/business/staff/StaffDashboard.tsx
"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StaffScheduleEditor from "./StaffScheduleEditor";

interface StaffSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  schedules: StaffSchedule[];
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface Business {
  id: string;
  name: string;
  staff: StaffMember[];
}

interface Props {
  business: Business;
  businessSlug: string;
}

export default function StaffDashboard({ business, businessSlug }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(business.staff);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] =
    useState<StaffMember | null>(null);

  const handleAddStaff = async () => {
    if (!newStaffName.trim()) {
      toast.error("Please enter a staff name");
      return;
    }

    setAddingStaff(true);
    try {
      const res = await fetch(`/api/business/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName.trim(),
          businessId: business.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to add staff");

      const data = await res.json();
      setStaff((prev) => [
        { ...data.staff, schedules: [], user: null },
        ...prev,
      ]);
      setNewStaffName("");
      setShowAddForm(false);
      toast.success("Staff member added successfully");
    } catch {
      toast.error("Failed to add staff member");
    } finally {
      setAddingStaff(false);
    }
  };

  const handleToggleActive = async (memberId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/business/staff/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!res.ok) throw new Error("Failed to update staff");

      setStaff((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isActive: !current } : m)),
      );
      toast.success(`Staff member ${!current ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update staff member");
    }
  };

  const handleUpdateName = async (memberId: string) => {
    if (!editingName.trim()) return;

    try {
      const res = await fetch(`/api/business/staff/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update name");

      setStaff((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, name: editingName.trim() } : m,
        ),
      );
      setEditingId(null);
      toast.success("Staff name updated");
    } catch {
      toast.error("Failed to update staff name");
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const res = await fetch(`/api/business/staff/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete staff");

      setStaff((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Staff member removed");
    } catch {
      toast.error("Failed to remove staff member");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">
              {staff.length} Team Member{staff.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {staff.filter((s) => s.isActive).length} active
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-xl font-bold gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Staff
        </Button>
      </div>

      {/* ADD STAFF FORM */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="font-bold text-foreground">New Staff Member</h3>
          <div className="flex gap-3">
            <Input
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              placeholder="e.g. Emeka Okafor"
              className="rounded-xl h-11"
              onKeyDown={(e) => e.key === "Enter" && handleAddStaff()}
            />
            <Button
              onClick={handleAddStaff}
              disabled={addingStaff}
              className="rounded-xl font-bold px-6 h-11 shrink-0"
            >
              {addingStaff ? "Adding..." : "Add"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewStaffName("");
              }}
              variant="outline"
              className="rounded-xl h-11 shrink-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* STAFF LIST */}
      {staff.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
          <UsersIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">
            No Staff Added Yet
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Add your team members to assign them to bookings and manage their
            schedules.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* AVATAR */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>

              {/* INFO */}
              <div className="flex-1 min-w-0 space-y-1">
                {editingId === member.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="rounded-xl h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateName(member.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateName(member.id)}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="font-bold text-foreground truncate">
                    {member.name}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`text-[10px] font-bold px-2 ${
                      member.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {member.isActive ? "● Active" : "● Inactive"}
                  </Badge>
                  {member.user && (
                    <span className="text-xs text-muted-foreground">
                      {member.user.email}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {member.schedules.length} schedule
                    {member.schedules.length !== 1 ? "s" : ""} set
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedStaffForSchedule(member);
                  }}
                  className="p-2 rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition"
                  title="Manage Schedule"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingId(member.id);
                    setEditingName(member.name);
                  }}
                  className="p-2 rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition"
                  title="Edit Name"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(member.id, member.isActive)}
                  className={`p-2 rounded-xl border transition ${
                    member.isActive
                      ? "border-border bg-background/50 text-muted-foreground hover:text-yellow-600 hover:border-yellow-500/30"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
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
                  onClick={() => handleDelete(member.id)}
                  className="p-2 rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition"
                  title="Remove Staff"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULE EDITOR MODAL */}
      {selectedStaffForSchedule && (
        <StaffScheduleEditor
          staff={selectedStaffForSchedule}
          onClose={() => setSelectedStaffForSchedule(null)}
          onUpdate={(updatedSchedules) => {
            setStaff((prev) =>
              prev.map((m) =>
                m.id === selectedStaffForSchedule.id
                  ? { ...m, schedules: updatedSchedules }
                  : m,
              ),
            );
          }}
        />
      )}
    </div>
  );
}
