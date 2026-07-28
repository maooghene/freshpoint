// components/checkout/CheckoutStockAlert.tsx
"use client";

import Link from "next/link";
import { AlertTriangleIcon, ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StockIssue {
  itemId: string;
  name: string;
  cartQty: number;
  available: number;
  exists: boolean;
}

interface CheckoutStockAlertProps {
  issues: StockIssue[];
}

export function CheckoutStockAlert({ issues }: CheckoutStockAlertProps) {
  return (
    <div className="space-y-3 w-full animate-in fade-in duration-200">
      <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1.5 text-left">
        <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
          <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
          Stock allocations have changed
        </p>
        <ul className="text-[11px] text-muted-foreground space-y-1 pl-5 list-disc">
          {issues.map((issue) => (
            <li key={issue.itemId}>
              <span className="font-semibold text-foreground">
                {issue.name}
              </span>
              : requested {issue.cartQty}, but only{" "}
              {issue.exists ? issue.available : 0} remains.
            </li>
          ))}
        </ul>
      </div>
      <Button
        asChild
        variant="outline"
        className="w-full py-5 rounded-xl text-xs font-bold border-destructive text-destructive hover:bg-destructive/5 flex items-center justify-center gap-2"
      >
        <Link href="/cart">
          <ShoppingBagIcon className="h-3.5 w-3.5" />
          Return to Cart to Fix Quantities
        </Link>
      </Button>
    </div>
  );
}
