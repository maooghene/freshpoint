// components/admin/complaint-card.tsx
"use client";

import { useState, useTransition } from "react";
import {
  ComplaintData,
  updateComplaintStatusAction,
  toggleCustomerBanAction,
} from "@/lib/actions/admin-complaints";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  UserX,
  UserCheck,
} from "lucide-react";

interface ComplaintCardProps {
  complaint: ComplaintData;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(complaint.status);

  // Track user profile client ban metrics
  const [isUserBanned, setIsUserBanned] = useState(complaint.user.isBanned);

  const handleStatusChange = (
    newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED",
  ) => {
    startTransition(async () => {
      const response = await updateComplaintStatusAction(
        complaint.id,
        newStatus,
      );
      if (response.success) {
        setStatus(newStatus);
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleToggleBan = () => {
    const nextBanState = !isUserBanned;

    const confirmMessage = nextBanState
      ? `Are you sure you want to block ${complaint.user.firstName || "this user"}? Their client profile and any business they own will be closed immediately.`
      : `Do you want to restore access for ${complaint.user.firstName || "this user"}?`;

    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      const response = await toggleCustomerBanAction(
        complaint.user.id,
        nextBanState,
      );
      if (response.success) {
        setIsUserBanned(nextBanState);
      } else {
        toast.error(response.message);
      }
    });
  };

  return (
    <Card
      className={`border-border bg-card shadow-sm rounded-2xl ${isPending ? "opacity-60 pointer-events-none" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 w-full">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {status === "OPEN" && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" /> Not Started
                  </Badge>
                )}
                {status === "IN_PROGRESS" && (
                  <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 gap-1 text-xs">
                    <Clock className="h-3 w-3" /> Being Fixed
                  </Badge>
                )}
                {status === "RESOLVED" && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-xs">
                    <CheckCircle className="h-3 w-3" /> Fixed
                  </Badge>
                )}
              </div>

              {isUserBanned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                  Account Banned
                </span>
              )}
            </div>

            <CardTitle className="text-base font-bold text-foreground pt-2">
              {complaint.summary}
            </CardTitle>
            <CardDescription className="text-xs">
              Sent by {complaint.user.firstName || "Customer"} (
              {complaint.user.email}) on{" "}
              {new Date(complaint.createdAt).toLocaleString("en-NG")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
          <div>
            <span className="font-semibold text-foreground">Store Name:</span>{" "}
            {complaint.business?.name ?? "Main Platform"}
          </div>
          {complaint.orderCode && (
            <div>
              <span className="font-semibold text-foreground">
                Order Number:
              </span>{" "}
              #{complaint.orderCode}
            </div>
          )}
          {complaint.bookingId && (
            <div>
              <span className="font-semibold text-foreground">
                Booking Number:
              </span>{" "}
              {complaint.bookingId.slice(0, 8)}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleToggleBan}
            className={`h-9 px-3 rounded-xl text-xs font-bold gap-2 cursor-pointer w-full sm:w-auto justify-center ${
              isUserBanned
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-rose-600 hover:bg-rose-50"
            }`}
          >
            {isUserBanned ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
            <span>
              {isUserBanned ? "Unblock Account" : "Block Customer Account"}
            </span>
          </Button>

          {status !== "RESOLVED" && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-auto">
              {status === "OPEN" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  className="h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer w-full sm:w-auto"
                >
                  Start Working On It
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleStatusChange("RESOLVED")}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-sm w-full sm:w-auto"
              >
                Mark As Fixed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
