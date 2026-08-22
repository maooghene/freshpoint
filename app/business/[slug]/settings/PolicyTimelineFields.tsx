"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hourglass, CalendarRange, Ban, ShieldAlert } from "lucide-react";

interface TimelineFieldsProps {
  business: {
    minNoticeHours: number;
    maxAheadDays: number;
    cancelWindowHours: number;
    bufferTimeMinutes: number;
  };
  isPending: boolean;
  errors?: {
    minNoticeHours?: string[];
    maxAheadDays?: string[];
    cancelWindowHours?: string[];
    bufferTimeMinutes?: string[];
  };
}

export function PolicyTimelineFields({
  business,
  isPending,
  errors,
}: TimelineFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <Label
          htmlFor="minNoticeHours"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Hourglass className="h-4 w-4 text-muted-foreground/80" /> Minimum
          Lead Notice (Hours)
        </Label>
        <Input
          id="minNoticeHours"
          name="minNoticeHours"
          type="number"
          min="0"
          max="72"
          defaultValue={business.minNoticeHours}
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.minNoticeHours && (
          <p className="text-xs font-medium text-destructive">
            {errors.minNoticeHours[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="maxAheadDays"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <CalendarRange className="h-4 w-4 text-muted-foreground/80" />{" "}
          Calendar Visibility Range (Days)
        </Label>
        <Input
          id="maxAheadDays"
          name="maxAheadDays"
          type="number"
          min="1"
          max="365"
          defaultValue={business.maxAheadDays}
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.maxAheadDays && (
          <p className="text-xs font-medium text-destructive">
            {errors.maxAheadDays[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="cancelWindowHours"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Ban className="h-4 w-4 text-muted-foreground/80" /> Cancellation
          Deadline (Hours)
        </Label>
        <Input
          id="cancelWindowHours"
          name="cancelWindowHours"
          type="number"
          min="0"
          max="168"
          defaultValue={business.cancelWindowHours}
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.cancelWindowHours && (
          <p className="text-xs font-medium text-destructive">
            {errors.cancelWindowHours[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="bufferTimeMinutes"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <ShieldAlert className="h-4 w-4 text-muted-foreground/80" /> Service
          Cool-down Buffer (Mins)
        </Label>
        <Input
          id="bufferTimeMinutes"
          name="bufferTimeMinutes"
          type="number"
          min="0"
          max="120"
          step="5"
          defaultValue={business.bufferTimeMinutes}
          disabled={isPending}
          required
          className="bg-background"
        />
        {errors?.bufferTimeMinutes && (
          <p className="text-xs font-medium text-destructive">
            {errors.bufferTimeMinutes[0]}
          </p>
        )}
      </div>
    </div>
  );
}
