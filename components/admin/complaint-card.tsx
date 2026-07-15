// components/admin/complaint-card.tsx
"use client";

import { useState, useTransition } from "react";
import {
  ComplaintData,
  updateComplaintStatusAction,
} from "@/lib/actions/admin-complaints";
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
} from "lucide-react";

interface ComplaintCardProps {
  complaint: ComplaintData;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(complaint.status);

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
      } else {
        alert(response.message);
      }
    });
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "MEDIUM":
        return "bg-amber-500 text-white hover:bg-amber-600";
      default:
        return "bg-muted-foreground text-background hover:opacity-90";
    }
  };

  return (
    <Card
      className={`border-border bg-card shadow-sm rounded-2xl ${isPending ? "opacity-60 pointer-events-none" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Keeping your exact original style function intact */}
              <Badge className={getSeverityStyle(complaint.severity)}>
                {complaint.severity === "HIGH"
                  ? "🔴 Emergency"
                  : complaint.severity === "MEDIUM"
                    ? "⚠️ High Priority"
                    : "Low Priority"}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {complaint.category}
              </Badge>
              {status === "OPEN" && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                  <AlertCircle className="h-3 w-3" /> Not Started
                </Badge>
              )}
              {status === "IN_PROGRESS" && (
                <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 gap-1 dark:text-sky-400">
                  <Clock className="h-3 w-3" /> Being Fixed
                </Badge>
              )}
              {status === "RESOLVED" && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> Fixed
                </Badge>
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
        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
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

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-0 text-xs h-7 text-primary hover:bg-transparent gap-1"
          >
            {expanded ? (
              <>
                Hide Report Details <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Read Full Customer Message <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
          {expanded && (
            <p className="mt-2 text-sm text-muted-foreground bg-muted/40 p-3 rounded-md border border-border whitespace-pre-wrap font-mono leading-relaxed">
              {complaint.rawMessage}
            </p>
          )}
        </div>

        {status !== "RESOLVED" && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            {status === "OPEN" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("IN_PROGRESS")}
              >
                Start Working On It
              </Button>
            )}
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => handleStatusChange("RESOLVED")}
            >
              Mark As Fixed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
