"use client";

import * as React from "react";
import { AlertOctagonIcon } from "lucide-react";

interface ModalAnnouncement {
  id: string;
  title: string;
  message: string;
}

interface AnnouncementModalProps {
  announcement: ModalAnnouncement | null;
  onDismiss: (id: string) => void;
}

export function AnnouncementModal({
  announcement,
  onDismiss,
}: AnnouncementModalProps) {
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertOctagonIcon className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="text-lg font-extrabold text-foreground">
            {announcement.title}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {announcement.message}
        </p>
        <button
          type="button"
          onClick={() => onDismiss(announcement.id)}
          className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold hover:opacity-90 transition"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
