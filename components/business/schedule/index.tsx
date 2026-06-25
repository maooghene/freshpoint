// src/components/business/schedule/index.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ScheduleItem, DAYS } from "./types";
import ScheduleRow from "./ScheduleRow";

interface BusinessScheduleProps {
  businessSlug: string;
}

export default function BusinessSchedule({
  businessSlug,
}: BusinessScheduleProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() =>
    DAYS.map((d) => ({
      day: d,
      openTime: "08:00",
      closeTime: "20:00",
      isClosed: false,
    })),
  );

  useEffect(() => {
    if (!businessSlug) return;
    const fetchSchedule = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(
          `/api/business/schedule?slug=${businessSlug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (Array.isArray(data) && data.length > 0) setSchedule(data);
      } catch (err) {
        console.error("Schedule fetch error:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchSchedule();
  }, [getToken, businessSlug]);

  const updateItem = useCallback(
    (index: number, field: keyof ScheduleItem, value: string | boolean) => {
      setSchedule((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const saveSchedule = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      await axios.post(
        "/api/business/schedule",
        { schedule, businessSlug },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Schedule updated successfully");
    } catch (err) {
      toast.error("Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Business Hours</h1>
        <p className="text-muted-foreground text-sm">
          Configure your opening and closing times.
        </p>
      </div>

      <div className="grid gap-4">
        {schedule.map((item, index) => (
          <ScheduleRow
            key={item.day}
            item={item}
            index={index}
            onUpdate={updateItem}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          Visible to all clients on your public catalog profile.
        </p>
        <Button
          onClick={saveSchedule}
          disabled={loading}
          className="px-8 py-6 font-bold shadow-lg"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save Schedule"
          )}
        </Button>
      </div>
    </div>
  );
}
