import React from "react";
import { HomeIcon, StoreIcon } from "lucide-react";

interface ReceiptFulfillmentProps {
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryNotes?: string | null;
}

export default function ReceiptFulfillment({
  isDelivery,
  deliveryAddress,
  deliveryNotes,
}: ReceiptFulfillmentProps) {
  return isDelivery ? (
    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2 animate-fadeIn">
      <div className="flex items-center gap-2 text-primary">
        <HomeIcon className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Home Delivery Manifest
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground leading-snug">
          {deliveryAddress || "Processing target drop-off destination..."}
        </p>
        {deliveryNotes && (
          <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50 mt-1 font-medium">
            <span className="font-bold text-foreground">Note:</span>{" "}
            {deliveryNotes}
          </p>
        )}
      </div>
    </div>
  ) : (
    <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-2 animate-fadeIn">
      <div className="flex items-center gap-2 text-muted-foreground">
        <StoreIcon className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
          In-Store Collection Method
        </span>
      </div>
      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
        Fulfillment defaults to storefront collection. Please bring this secure
        digital voucher ID badge directly to the merchant partner location
        listed below to claim your inventory package.
      </p>
    </div>
  );
}
