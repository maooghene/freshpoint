"use client";

import * as React from "react";
import { XIcon, InfoIcon, AlertTriangleIcon } from "lucide-react";

interface BannerAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING";
}

interface AnnouncementBannerProps {
  announcements: BannerAnnouncement[];
  onDismiss: (id: string) => void;
}

const severityConfig = {
  INFO: {
    icon: InfoIcon,
    className: "bg-primary/10 border-primary/20 text-primary",
  },
  WARNING: {
    icon: AlertTriangleIcon,
    className: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  },
};

export function AnnouncementBanner({
  announcements,
  onDismiss,
}: AnnouncementBannerProps) {
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {announcements.map((a) => {
        const config = severityConfig[a.severity];
        const Icon = config.icon;
        return (
          <div
            key={a.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${config.className}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{a.title}</p>
              <p className="opacity-90 mt-0.5">{a.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(a.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition"
              aria-label="Dismiss announcement"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
