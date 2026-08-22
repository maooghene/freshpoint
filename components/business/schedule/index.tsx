"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
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

  // 1️⃣ Fix: Abstracting request logic out into a unified handler to prevent rendering lag crashes
  const fetchScheduleData = useCallback(
    async (slug: string, isMounted: boolean) => {
      try {
        // 2️⃣ Fix: Aligned URL path with your true plural backend folder structure: '/api/businesses/schedule'
        const res = await fetch(`/api/businesses/schedule?slug=${slug}`);

        if (!res.ok) {
          throw new Error("Failed to load operational hours");
        }

        const data = await res.json();

        if (isMounted && Array.isArray(data) && data.length > 0) {
          setSchedule(data);
        }
      } catch (err) {
        console.error("Schedule fetch error:", err);
      } finally {
        if (isMounted) setFetching(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!businessSlug) return;
    let isMounted = true;

    // Defer the execution to safely break out of any synchronous state cascade loops
    const timer = setTimeout(() => {
      fetchScheduleData(businessSlug, isMounted);
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [businessSlug, fetchScheduleData]);

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

      // 3️⃣ Fix: Swapped out legacy Axios header tokens for browser native request configurations matching your backend structure
      const res = await fetch("/api/businesses/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule,
          businessSlug,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(
          errPayload.error || "Failed to update schedule metrics",
        );
      }

      toast.success("Schedule updated successfully");
    } catch (err) {
      console.error("Save schedule error:", err);
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
    <div className="max-w-4xl mx-auto space-y-8 p-4 animate-in fade-in duration-200">
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
          className="px-8 py-6 font-bold shadow-lg cursor-pointer"
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
