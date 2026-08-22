import React from "react";
import { Loader2 } from "lucide-react";

export default function ReceiptSkeleton() {
  return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center bg-background text-foreground">
      <Loader2 className="animate-spin text-emerald-500 size-8 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">
        Retrieving secure transaction tokens...
      </p>
    </div>
  );
}
