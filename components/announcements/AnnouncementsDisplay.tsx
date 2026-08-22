"use client";

import * as React from "react";
import { dismissAnnouncementAction } from "@/lib/actions/announcements";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { AnnouncementModal } from "./AnnouncementModal";

interface FetchedAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export function AnnouncementsDisplay({ businessId }: { businessId?: string }) {
  const [announcements, setAnnouncements] = React.useState<
    FetchedAnnouncement[]
  >([]);

  React.useEffect(() => {
    let isMounted = true;

    const fetchAnnouncements = async () => {
      try {
        const url = businessId
          ? `/api/announcements/active?businessId=${businessId}`
          : "/api/announcements/active";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setAnnouncements(data.announcements || []);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };

    void fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, [businessId]);

  const handleDismiss = async (id: string) => {
    // Optimistic removal
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    try {
      await dismissAnnouncementAction(id);
    } catch (err) {
      console.error("Failed to dismiss announcement:", err);
    }
  };

  const bannerItems = announcements.filter(
    (a): a is FetchedAnnouncement & { severity: "INFO" | "WARNING" } =>
      a.severity === "INFO" || a.severity === "WARNING",
  );
  const criticalItem =
    announcements.find((a) => a.severity === "CRITICAL") || null;

  return (
    <>
      <AnnouncementBanner
        announcements={bannerItems}
        onDismiss={handleDismiss}
      />
      <AnnouncementModal
        announcement={criticalItem}
        onDismiss={handleDismiss}
      />
    </>
  );
}
