import React from "react";
import { SparklesIcon, CheckCircleIcon } from "lucide-react";

interface ReceiptHeaderProps {
  orderId: string;
  orderCode?: string; // 👈 NEW INJECTION: Optional string token for your human-readable code
}

export default function ReceiptHeader({
  orderId,
  orderCode,
}: ReceiptHeaderProps) {
  // Fallback to sliced ID string only if orderCode wasn't passed down by parent containers
  const displayIdentifier = orderCode
    ? orderCode
    : `#${orderId.slice(-8).toUpperCase()}`;

  return (
    <div className="relative bg-gradient-to-br from-primary to-primary/80 px-8 py-7 overflow-hidden">
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary-foreground/80" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70">
              FreshPoint
            </span>
          </div>
          <h2 className="text-2xl font-black text-primary-foreground tracking-tight">
            Order Receipt
          </h2>
          <p className="text-xs text-primary-foreground/70 font-medium">
            Thank you for your purchase
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold uppercase tracking-widest text-primary-foreground/60 mb-1">
            Order ID
          </p>
          {/* FIX: Renders the beautiful FP-332 code clearly without slicing off characters */}
          <span className="font-mono font-black text-primary-foreground bg-white/15 px-3 py-1.5 rounded-xl text-lg border border-white/10 backdrop-blur-xs">
            {displayIdentifier}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-100/20 border border-emerald-200 dark:border-emerald-300/30 text-emerald-700 dark:text-emerald-800 px-3 py-1.5 rounded-full transition-colors duration-200">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-800" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Payment Confirmed
          </span>
        </div>
      </div>
    </div>
  );
}
