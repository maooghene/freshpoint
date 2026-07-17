"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { toggleCustomerBanAction } from "@/lib/actions/admin-complaints";
import { Button } from "@/components/ui/button";
import { Ban, ShieldCheck } from "lucide-react";

export function UserDetailBanControl({
  userId,
  isBanned,
}: {
  userId: string;
  isBanned: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banned, setBanned] = useState(isBanned);

  const handleToggle = () => {
    startTransition(async () => {
      const response = await toggleCustomerBanAction(userId, !banned);
      if (response.success) {
        setBanned(!banned);
        toast.success(response.message);
        router.refresh();
      } else {
        toast.error(response.message);
      }
    });
  };

  return (
    <Button
      disabled={isPending}
      onClick={handleToggle}
      className={
        banned
          ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2"
          : "bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl gap-2"
      }
    >
      {banned ? (
        <>
          <ShieldCheck className="h-4 w-4" /> Unban Account
        </>
      ) : (
        <>
          <Ban className="h-4 w-4" /> Ban Account
        </>
      )}
    </Button>
  );
}
