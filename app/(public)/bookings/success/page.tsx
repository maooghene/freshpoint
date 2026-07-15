// app/(public)/bookings/success/page.tsx
"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BookingSuccessContent } from "@/components/booking/BookingSuccessContent";

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <Loader2 className="animate-spin w-6 h-6 text-primary" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
