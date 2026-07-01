"use client";

import { useState } from "react";
import { MailIcon, BriefcaseIcon, Loader2Icon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteStaffFormProps {
  addingStaff: boolean;
  onInvite: (name: string, email: string, role: string) => Promise<void>;
  onCancel: () => void;
}

export default function InviteStaffForm({
  addingStaff,
  onInvite,
  onCancel,
}: InviteStaffFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Specialist");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(name, email, role);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <h3 className="font-extrabold text-foreground text-sm">
        Send Onboarding Invitation
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Sparkles size={10} className="text-primary" /> Staff Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Samuel Okafor"
            className="rounded-xl h-11 bg-background"
            disabled={addingStaff}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <MailIcon size={10} className="text-primary" /> Invitation Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="samuel@gmail.com"
            className="rounded-xl h-11 bg-background"
            disabled={addingStaff}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <BriefcaseIcon size={10} className="text-primary" /> Speciality Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-border rounded-xl px-3 h-11 bg-background outline-none text-xs font-bold text-foreground w-full cursor-pointer focus:border-primary transition-all shadow-xs"
            disabled={addingStaff}
          >
            <option value="Barber"> Senior Barber</option>
            <option value="Hair Stylist"> Hair Stylist</option>
            <option value="Nail Technician"> Nail Technician</option>
            <option value="Therapist"> Massage Therapist</option>
            <option value="Specialist"> General Specialist</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="rounded-xl h-10 text-xs font-bold cursor-pointer"
          disabled={addingStaff}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={addingStaff}
          className="rounded-xl font-bold px-6 h-10 text-xs cursor-pointer shadow-sm"
        >
          {addingStaff ? (
            <>
              <Loader2Icon className="animate-spin w-3.5 h-3.5 mr-2" />
              Sending token...
            </>
          ) : (
            "Send Invitation"
          )}
        </Button>
      </div>
    </form>
  );
}
