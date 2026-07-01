"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { UsersIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import InviteStaffForm from "./InviteStaffForm";
import StaffMemberRow from "./StaffMemberRow";
import StaffScheduleEditor from "./StaffScheduleEditor";
import { Business, StaffMember } from "./types";

interface Props {
  business: Business;
  businessSlug: string;
}

export default function StaffDashboard({ business, businessSlug }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(business.staff);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] =
    useState<StaffMember | null>(null);

  const handleInviteStaff = async (
    name: string,
    email: string,
    role: string,
  ) => {
    setAddingStaff(true);
    try {
      const res = await fetch(`/api/businesses/${business.id}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.toLowerCase(),
          role,
          businessId: business.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add staff");

      setStaff((prev) => [
        { ...data.staff, schedules: [], user: null },
        ...prev,
      ]);
      setShowAddForm(false);
      toast.success(`Invitation delivered safely to ${email.toLowerCase()}!`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite teammate.",
      );
    } finally {
      setAddingStaff(false);
    }
  };

  const handleToggleActive = async (staffId: string, current: boolean) => {
    try {
      const res = await fetch(
        `/api/businesses/${business.id}/staff/${staffId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !current }),
        },
      );
      if (!res.ok) throw new Error("Failed to update staff");
      setStaff((prev) =>
        prev.map((m) => (m.id === staffId ? { ...m, isActive: !current } : m)),
      );
      toast.success(`Staff member ${!current ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update staff member status");
    }
  };

  const handleUpdateName = async (staffId: string, newName: string) => {
    try {
      const res = await fetch(
        `/api/businesses/${business.id}/staff/${staffId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        },
      );
      if (!res.ok) throw new Error("Failed to update name");
      setStaff((prev) =>
        prev.map((m) => (m.id === staffId ? { ...m, name: newName } : m)),
      );
      toast.success("Staff name updated");
    } catch {
      toast.error("Failed to update staff name");
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(
        `/api/businesses/${business.id}/staff/${staffId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete staff");
      setStaff((prev) => prev.filter((m) => m.id !== staffId));
      toast.success("Staff member removed");
    } catch {
      toast.error("Failed to remove staff member");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl">
      <div className="flex items-center justify-between border border-border bg-card p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">
              {staff.length} Team Member{staff.length !== 1 ? "s" : ""}{" "}
              registered
            </p>
            <p className="text-xs text-muted-foreground">
              {staff.filter((s) => s.isActive).length} active workspace profiles
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-xl font-bold gap-2 cursor-pointer shadow-sm"
        >
          <PlusIcon className="w-4 h-4" /> Add Teammate
        </Button>
      </div>

      {showAddForm && (
        <InviteStaffForm
          addingStaff={addingStaff}
          onInvite={handleInviteStaff}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {staff.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
          <UsersIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">
            No Staff Members Onboarded Yet
          </h3>
          <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">
            Click the button above to type an employee&apos;s email address and
            shoot out your first secure workspace invitation token.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <StaffMemberRow
              key={member.id}
              member={member}
              onToggleActive={handleToggleActive}
              onUpdateName={handleUpdateName}
              onDelete={handleDeleteStaff}
              onManageSchedule={setSelectedStaffForSchedule}
            />
          ))}
        </div>
      )}

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
