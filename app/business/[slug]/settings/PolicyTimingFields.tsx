"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Hourglass, Calendar, Ban, RefreshCw } from "lucide-react";

interface TimingFieldsProps {
  business: {
    minNoticeHours: number;
    maxAheadDays: number;
    cancelWindowHours: number;
    bufferTimeMinutes: number;
  };
  isPending: boolean;
}

export function PolicyTimingFields({ business, isPending }: TimingFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <Label
          htmlFor="minNoticeHours"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Hourglass className="h-4 w-4 text-muted-foreground/80" /> How early
          must clients book?
        </Label>
        <p className="text-xs text-muted-foreground">
          Example: Enter 2 to stop clients from booking slots less than 2 hours
          away.
        </p>
        <div className="relative flex items-center">
          <Input
            id="minNoticeHours"
            name="minNoticeHours"
            type="number"
            min="0"
            defaultValue={business.minNoticeHours}
            disabled={isPending}
            required
            className="bg-background pr-16"
          />
          <span className="absolute right-3 text-xs text-muted-foreground font-semibold pointer-events-none">
            Hours
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="maxAheadDays"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Calendar className="h-4 w-4 text-muted-foreground/80" /> How far
          ahead can clients book?
        </Label>
        <p className="text-xs text-muted-foreground">
          Example: Enter 30 if you only want your calendar open for the next 30
          days.
        </p>
        <div className="relative flex items-center">
          <Input
            id="maxAheadDays"
            name="maxAheadDays"
            type="number"
            min="1"
            defaultValue={business.maxAheadDays}
            disabled={isPending}
            required
            className="bg-background pr-16"
          />
          <span className="absolute right-3 text-xs text-muted-foreground font-semibold pointer-events-none">
            Days
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="cancelWindowHours"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <Ban className="h-4 w-4 text-muted-foreground/80" /> Free cancellation
          cut-off
        </Label>
        <p className="text-xs text-muted-foreground">
          Example: Enter 24 if clients cannot cancel within 24 hours of the
          appointment.
        </p>
        <div className="relative flex items-center">
          <Input
            id="cancelWindowHours"
            name="cancelWindowHours"
            type="number"
            min="0"
            defaultValue={business.cancelWindowHours}
            disabled={isPending}
            required
            className="bg-background pr-16"
          />
          <span className="absolute right-3 text-xs text-muted-foreground font-semibold pointer-events-none">
            Hours
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="bufferTimeMinutes"
          className="flex items-center gap-2 text-foreground/90 font-medium"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground/80" /> Rest time
          between appointments
        </Label>
        <p className="text-xs text-muted-foreground">
          Example: Enter 15 to give workers 15 minutes to clean up before the
          next client.
        </p>
        <div className="relative flex items-center">
          <Input
            id="bufferTimeMinutes"
            name="bufferTimeMinutes"
            type="number"
            min="0"
            defaultValue={business.bufferTimeMinutes}
            disabled={isPending}
            required
            className="bg-background pr-16"
          />
          <span className="absolute right-3 text-xs text-muted-foreground font-semibold pointer-events-none">
            Mins
          </span>
        </div>
      </div>
    </div>
  );
}
