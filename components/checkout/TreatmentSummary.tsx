// components/checkout/TreatmentSummary.tsx
"use client";

import { Calendar, Clock, Sparkles } from "lucide-react";

interface ItemDetails {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  business: {
    id: string;
    name: string;
  };
}

interface TreatmentSummaryProps {
  item: ItemDetails;
  formattedDate: string | null;
  decodedTime: string | null;
}

export function TreatmentSummary({
  item,
  formattedDate,
  decodedTime,
}: TreatmentSummaryProps) {
  return (
    <div className="border border-border rounded-2xl p-6 mb-6 bg-card shadow-xs">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2 tracking-tight">
        <Sparkles className="w-5 h-5 text-primary" />
        Treatment Summary
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <span className="text-muted-foreground text-sm font-medium">
            Provider
          </span>
          <span className="font-bold text-foreground text-right tracking-tight">
            {item.business.name}
          </span>
        </div>

        <div className="flex justify-between items-start gap-4">
          <span className="text-muted-foreground text-sm font-medium">
            Service
          </span>
          <span className="font-bold text-foreground text-right tracking-tight">
            {item.name}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground text-sm font-medium">
            Price Rate
          </span>
          <span className="font-black text-primary text-lg">
            ₦{Number(item.price).toLocaleString()}
          </span>
        </div>

        {item.duration && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Duration
            </span>
            <span className="font-semibold text-sm text-foreground bg-muted px-2.5 py-1 rounded-md">
              {item.duration} mins
            </span>
          </div>
        )}

        {formattedDate && (
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Calendar className="w-4 h-4 text-primary/70" />
              Date
            </div>
            <span className="font-semibold text-sm text-foreground">
              {formattedDate}
            </span>
          </div>
        )}

        {decodedTime && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Clock className="w-4 h-4 text-primary/70" />
              Time Slot
            </div>
            <span className="font-semibold text-sm text-foreground">
              {decodedTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
