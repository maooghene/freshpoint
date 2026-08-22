"use client";

import * as React from "react";
import {
  toggleAnnouncementActiveAction,
  deleteAnnouncementAction,
} from "@/lib/actions/admin-announcements";

interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  severity: string;
  targetType: string;
  targetRole: string | null;
  isActive: boolean;
  createdAt: Date;
  endsAt: Date | null;
  targetBusiness: { name: string } | null;
  createdBy: { firstName: string | null; lastName: string | null };
  _count: { dismissals: number };
}

const severityStyles: Record<string, string> = {
  INFO: "bg-primary/10 text-primary",
  WARNING: "bg-amber-500/10 text-amber-600",
  CRITICAL: "bg-destructive/10 text-destructive",
};

export function AnnouncementsTable({
  announcements,
}: {
  announcements: AnnouncementRow[];
}) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setPendingId(id);
    try {
      await toggleAnnouncementActiveAction(id);
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement permanently?")) return;
    setPendingId(id);
    try {
      await deleteAnnouncementAction(id);
    } finally {
      setPendingId(null);
    }
  };

  const audienceLabel = (a: AnnouncementRow) => {
    if (a.targetType === "ALL") return "Everyone";
    if (a.targetType === "ROLE") return `Role: ${a.targetRole}`;
    if (a.targetType === "BUSINESS")
      return a.targetBusiness?.name || "Unknown business";
    return a.targetType;
  };

  if (announcements.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        No announcements yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border text-sm">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="py-4 flex flex-col md:flex-row md:items-center gap-3 justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${severityStyles[a.severity]}`}
              >
                {a.severity}
              </span>
              {!a.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary text-muted-foreground">
                  Disabled
                </span>
              )}
              <span className="font-semibold text-foreground truncate">
                {a.title}
              </span>
            </div>
            <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
              {a.message}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {audienceLabel(a)} · {a._count.dismissals} dismissal
              {a._count.dismissals === 1 ? "" : "s"} ·{" "}
              {new Date(a.createdAt).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
              {a.endsAt &&
                ` · ends ${new Date(a.endsAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={pendingId === a.id}
              onClick={() => handleToggle(a.id)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/50 transition disabled:opacity-50"
            >
              {a.isActive ? "Disable" : "Enable"}
            </button>
            <button
              type="button"
              disabled={pendingId === a.id}
              onClick={() => handleDelete(a.id)}
              className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
