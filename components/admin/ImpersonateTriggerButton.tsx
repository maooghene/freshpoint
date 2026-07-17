// components/admin/ImpersonateTriggerButton.tsx
"use client";

import { useTransition } from "react";
import { startImpersonationAction } from "@/lib/actions/admin-impersonate";
import { toast } from "react-toastify";
import { UserCheck } from "lucide-react";

interface ImpersonateButtonProps {
  businessId: string;
}

export function ImpersonateTriggerButton({
  businessId,
}: ImpersonateButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleLaunch = () => {
    startTransition(async () => {
      try {
        const res = await startImpersonationAction(businessId);
        if (res.success) {
          toast.success(
            "Impersonation context mounted. Redirecting to store shell...",
          );
          window.location.href = res.redirectUrl;
        }
      } catch (err: any) {
        toast.error(
          err.message || "Failed to establish impersonation channel.",
        );
      }
    });
  };

  return (
    <button
      onClick={handleLaunch}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/10 transition-all cursor-pointer disabled:opacity-50"
    >
      <UserCheck className="h-4 w-4" />
      <span>{isPending ? "Configuring Session..." : "Impersonate Store"}</span>
    </button>
  );
}
