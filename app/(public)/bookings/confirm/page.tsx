// app/(public)/bookings/confirm/page.tsx
"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BookingConfirmContent } from "@/components/booking/BookingConfirmContent";

export default function BookingConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <Loader2 className="animate-spin w-6 h-6 text-primary" />
        </div>
      }
    >
      <BookingConfirmContent />
    </Suspense>
  );
}
