// components/admin/BusinessDetailControls.tsx
"use server";

import {
  updateVendorStatusAction,
  toggleVendorPayoutFreezeAction,
} from "@/lib/actions/admin-vendors";
import { revalidatePath } from "next/cache";

interface ControlsProps {
  businessId: string;
  currentStatus: string;
  isPayoutFrozen: boolean;
}

export async function BusinessDetailControls({
  businessId,
  currentStatus,
  isPayoutFrozen,
}: ControlsProps) {
  async function handleStatusToggle() {
    "use server";
    const nextStatus = currentStatus === "approved" ? "suspended" : "approved";
    // Matching signature: businessId, status string, and the isActive boolean flag
    await updateVendorStatusAction(
      businessId,
      nextStatus,
      nextStatus === "approved",
    );
    revalidatePath(`/admin/businesses/${businessId}`);
  }

  async function handleFreezeToggle() {
    "use server";
    const nextFreezeState = !isPayoutFrozen;
    await toggleVendorPayoutFreezeAction(businessId, nextFreezeState);
    revalidatePath(`/admin/businesses/${businessId}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <form action={handleStatusToggle}>
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            currentStatus === "approved"
              ? "bg-destructive text-white hover:bg-destructive/90 shadow-md shadow-destructive/10"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10"
          }`}
        >
          {currentStatus === "approved"
            ? "Suspend Business"
            : "Approve Business"}
        </button>
      </form>

      <form action={handleFreezeToggle}>
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            isPayoutFrozen
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10"
              : "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/10"
          }`}
        >
          {isPayoutFrozen ? "Unfreeze Payouts" : "Freeze Payouts"}
        </button>
      </form>
    </div>
  );
}
