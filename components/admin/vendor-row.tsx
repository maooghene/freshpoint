// components/admin/vendor-row.tsx
"use client";

import { useState, useTransition } from "react";
import {
  updateVendorStatusAction,
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
import {
  MoreHorizontal,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";

interface VendorRowProps {
  vendor: VendorDetails;
}

export function VendorRow({ vendor }: VendorRowProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(vendor.status);

  const handleStatusUpdate = (
    status: "approved" | "suspended" | "pending",
    isActive: boolean,
  ) => {
    startTransition(async () => {
      const response = await updateVendorStatusAction(
        vendor.id,
        status,
        isActive,
      );
      if (response.success) {
        setLocalStatus(status);
      } else {
        alert(response.message);
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
        {vendor.name}
        <div className="text-xs font-normal text-muted-foreground mt-0.5">
          /{vendor.slug}
        </div>
      </TableCell>
      <TableCell className="text-foreground">
        {vendor.email}
        <div className="text-xs text-muted-foreground mt-0.5">
          {vendor.phone}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(localStatus)}`}
        >
          {/* Kept internal code types intact, simplified label display names */}
          {localStatus === "approved" && "Approved"}
          {localStatus === "suspended" && "Suspended"}
          {localStatus !== "approved" &&
            localStatus !== "suspended" &&
            "Pending"}
        </span>
      </TableCell>
      <TableCell className="text-sm font-medium text-foreground">
        ₦{vendor.baseDeliveryFee} Base / ₦{vendor.deliveryFeePerKm}/km
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(vendor.createdAt).toLocaleDateString("en-NG")}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-card border border-border text-card-foreground"
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Actions
            </DropdownMenuLabel>

            {localStatus !== "approved" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("approved", true)}
                className="text-primary hover:bg-muted gap-2 cursor-pointer font-medium"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Approve Store</span>
              </DropdownMenuItem>
            )}

            {localStatus !== "suspended" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("suspended", false)}
                className="text-destructive hover:bg-muted gap-2 cursor-pointer font-medium"
              >
                <AlertOctagon className="h-4 w-4" />
                <span>Suspend Store</span>
              </DropdownMenuItem>
            )}

            {localStatus !== "pending" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("pending", false)}
                className="text-accent hover:bg-muted gap-2 cursor-pointer font-medium"
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
