"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import InviteStaffForm from "./InviteStaffForm";
import StaffMemberRow from "./StaffMemberRow";
import StaffScheduleEditor from "./StaffScheduleEditor";

// Clean modular sub-module component mappings
import { DashboardHeaderCard } from "./components/DashboardHeaderCard";
import { EmptyStaffState } from "./components/EmptyStaffState";
import { Business, StaffMember } from "./types";

interface StaffDashboardProps {
  business: Business;
  businessId: string;
  businessSlug: string;
}

export default function StaffDashboard({
  business,
  businessId,
  businessSlug,
}: StaffDashboardProps): React.JSX.Element {
  const [staff, setStaff] = useState<StaffMember[]>(business.staff);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [addingStaff, setAddingStaff] = useState<boolean>(false);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] =
    useState<StaffMember | null>(null);

  const handleInviteStaff = async (
    name: string,
    email: string,
    role: string,
  ): Promise<void> => {
    setAddingStaff(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.toLowerCase().trim(),
          role,
          businessId: businessId,
        }),
      });

      const data = (await res.json()) as { staff: StaffMember; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to add staff");

      setStaff((prev) => [
        { ...data.staff, schedules: [], user: null },
        ...prev,
      ]);
      setShowAddForm(false);
      toast.success(`Invitation delivered safely to ${email.toLowerCase()}!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to invite teammate.";
      toast.error(msg);
    } finally {
      setAddingStaff(false);
    }
  };

  const handleToggleActive = async (
    staffId: string,
    current: boolean,
  ): Promise<void> => {
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/staff/${staffId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !current }),
        },
      );
      if (!res.ok) throw new Error("Failed validation schema update");

      setStaff((prev) =>
        prev.map((m) => (m.id === staffId ? { ...m, isActive: !current } : m)),
      );
      toast.success(`Staff member ${!current ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update staff member status");
    }
  };

  const handleUpdateName = async (
    staffId: string,
    newName: string,
  ): Promise<void> => {
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/staff/${staffId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        },
      );
      if (!res.ok) throw new Error("Failed name adjustment update transaction");

      setStaff((prev) =>
        prev.map((m) => (m.id === staffId ? { ...m, name: newName } : m)),
      );
      toast.success("Staff name updated");
    } catch {
      toast.error("Failed to update staff name");
    }
  };

  const handleDeleteStaff = async (staffId: string): Promise<void> => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/staff/${staffId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Deletion failed");

      setStaff((prev) => prev.filter((m) => m.id !== staffId));
      toast.success("Staff member removed");
    } catch {
      toast.error("Failed to remove staff member");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl animate-in fade-in duration-200">
      <DashboardHeaderCard
        staffList={staff}
        showAddForm={showAddForm}
        onToggleAddForm={() => setShowAddForm(!showAddForm)}
      />

      {showAddForm && (
        <InviteStaffForm
          addingStaff={addingStaff}
          onInvite={handleInviteStaff}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {staff.length === 0 ? (
        <EmptyStaffState />
      ) : (
        <div className="space-y-3 w-full">
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
          businessId={businessId}
          businessSlug={businessSlug}
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
