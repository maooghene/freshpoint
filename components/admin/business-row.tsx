// components/admin/business-row.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  updateVendorStatusAction,
  toggleVendorPayoutFreezeAction,
  VendorDetails,
} from "@/lib/actions/admin-vendors";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import {
  MoreHorizontal,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Coins,
  Lock,
  ExternalLink,
} from "lucide-react";

interface BusinessRowProps {
  business: VendorDetails & {
    owner?: {
      isBanned: boolean;
    };
  };
}

export function BusinessRow({ business }: BusinessRowProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(business.status);
  const [isFrozen, setIsFrozen] = useState(business.isPayoutFrozen);

  const handleStatusUpdate = (
    status: "approved" | "suspended" | "pending",
    isActive: boolean,
  ) => {
    startTransition(async () => {
      const response = await updateVendorStatusAction(
        business.id,
        status,
        isActive,
      );
      if (response.success) {
        setLocalStatus(status);
        toast.success(response.message ?? "Business status updated.");
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleToggleFreeze = () => {
    const nextFreezeState = !isFrozen;
    startTransition(async () => {
      const response = await toggleVendorPayoutFreezeAction(
        business.id,
        nextFreezeState,
      );
      if (response.success) {
        setIsFrozen(nextFreezeState);
        toast.success(response.message ?? "Payout status updated.");
      } else {
        toast.error(response.message);
      }
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-primary/10 text-primary border-primary/20";
      case "suspended":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-accent/10 text-accent border-accent/20";
    }
  };

  return (
    <TableRow
      className={`border-b border-border hover:bg-muted/40 transition-colors ${isPending ? "opacity-60 pointer-events-none" : ""}`}
    >
      <TableCell className="font-semibold text-foreground">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Linked title for full administrative drill-down view */}
          <Link
            href={`/admin/businesses/${business.id}`}
            className="hover:underline text-primary font-bold inline-flex items-center gap-1 group"
          >
            {business.name}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* CASCADING CHECK: If the owner's customer profile is banned, display flag status immediately */}
          {business.owner?.isBanned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white uppercase tracking-tight">
              Owner Account Banned
            </span>
          )}

          {isFrozen && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase tracking-tight">
              <Lock className="h-2.5 w-2.5" /> Payout Frozen
            </span>
          )}
        </div>
        <div className="text-xs font-normal text-muted-foreground mt-0.5">
          /{business.slug}
        </div>
      </TableCell>
      <TableCell className="text-foreground">
        {business.email}
        <div className="text-xs text-muted-foreground mt-0.5">
          {business.phone}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(localStatus)}`}
        >
          {localStatus === "approved" && "Approved"}
          {localStatus === "suspended" && "Suspended"}
          {localStatus !== "approved" &&
            localStatus !== "suspended" &&
            "Pending"}
        </span>
      </TableCell>
      <TableCell className="text-sm font-medium text-foreground">
        ₦{business.baseDeliveryFee} Base / ₦{business.deliveryFeePerKm}/km
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(business.createdAt).toLocaleDateString("en-NG")}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 bg-card border border-border text-card-foreground shadow-md rounded-xl"
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs font-medium px-2 py-1.5">
              Actions
            </DropdownMenuLabel>

            {/* Direct access to full detail page explicitly inside the drop menu list */}
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/businesses/${business.id}`}
                className="w-full flex items-center gap-2 cursor-pointer font-semibold text-xs py-2 hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Full Details</span>
              </Link>
            </DropdownMenuItem>

            {localStatus !== "approved" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("approved", true)}
                className="text-primary hover:bg-muted gap-2 cursor-pointer font-semibold text-xs py-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Approve Store</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={handleToggleFreeze}
              className={`gap-2 cursor-pointer font-semibold text-xs py-2 ${
                isFrozen
                  ? "text-emerald-600 hover:bg-emerald-50/10"
                  : "text-amber-600 hover:bg-amber-500/10"
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>
                {isFrozen ? "Unfreeze Store Payouts" : "Freeze Store Payouts"}
              </span>
            </DropdownMenuItem>

            {localStatus !== "suspended" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("suspended", false)}
                className="text-destructive hover:bg-destructive/10 gap-2 cursor-pointer font-semibold text-xs py-2"
              >
                <AlertOctagon className="h-4 w-4" />
                <span>Suspend Store</span>
              </DropdownMenuItem>
            )}

            {localStatus !== "pending" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("pending", false)}
                className="text-accent hover:bg-muted gap-2 cursor-pointer font-semibold text-xs py-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset to Waiting</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
