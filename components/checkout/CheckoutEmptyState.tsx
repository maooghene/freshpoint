// components/checkout/CheckoutEmptyState.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CheckoutEmptyState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        Your basket is currently empty.
      </p>
      <Button
        asChild
        variant="outline"
        className="rounded-xl font-bold border-border shadow-xs hover:bg-muted/40 transition-colors"
      >
        <Link href="/explore">Start Shopping</Link>
      </Button>
    </div>
  );
}
