"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/orders/OrderCard";

interface HistoryItem {
  id: string;
  itemId: string;
  quantity: number;
  price: number;
  name: string;
  image: string | null;
}

interface HistoryOrder {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryFee: number;
  businessId: string;
  createdAt: string;
  business: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  items: HistoryItem[];
}

interface CustomerHistoryLedgerProps {
  initialOrders: HistoryOrder[];
}

export default function CustomerHistoryLedger({
  initialOrders,
}: CustomerHistoryLedgerProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredOrders = initialOrders.filter((order) => {
    const rawSearch = searchQuery.trim().toLowerCase();
    if (!rawSearch) return true;

    const searchTokens = rawSearch.split(/\s+/);

    // ✅ Parse into a real Date and read LOCAL components,
    // instead of slicing the raw UTC ISO string. This ensures the
    // calendar date matches what the customer actually experienced
    // (important for orders placed late at night in WAT / UTC+1).
    const orderDate = new Date(order.createdAt);

    const numericYear = String(orderDate.getFullYear());
    const monthIndex = orderDate.getMonth(); // 0-based, already local
    const numericDay = String(orderDate.getDate()); // local day, no leading zero
    const paddedDay = numericDay.padStart(2, "0");

    const monthsLong = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const monthsShort = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    const fullMonthName = monthsLong[monthIndex] || "";
    const shortMonthName = monthsShort[monthIndex] || "";

    const fullDayName = orderDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const shortDayName = orderDate
      .toLocaleDateString("en-US", { weekday: "short" })
      .toLowerCase();

    const vendorName = order.business.name.toLowerCase();
    const paystackId = order.id.toLowerCase();
    const shortCode = order.code ? order.code.toLowerCase() : "";

    return searchTokens.every((token) => {
      const isPureNumber = /^\d+$/.test(token);

      // Only check ID/code for tokens that aren't short pure numbers —
      // short digits are meant to be day/year lookups, not ID substrings.
      const vendorMatches = vendorName.includes(token);
      const idMatches =
        !isPureNumber || token.length >= 4 ? paystackId.includes(token) : false;
      const codeMatches =
        !isPureNumber || token.length >= 4 ? shortCode.includes(token) : false;

      const monthLongMatches = fullMonthName.includes(token);
      const monthShortMatches = shortMonthName.includes(token);
      const yearMatches = numericYear === token;
      const dayNumberMatches = numericDay === token || paddedDay === token;
      const weekdayLongMatches = fullDayName.includes(token);
      const weekdayShortMatches = shortDayName.includes(token);

      return (
        vendorMatches ||
        idMatches ||
        codeMatches ||
        monthLongMatches ||
        monthShortMatches ||
        yearMatches ||
        dayNumberMatches ||
        weekdayLongMatches ||
        weekdayShortMatches
      );
    });
  });

  if (initialOrders.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-3xl bg-card">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground">
          No transaction lines found
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
          You haven&apos;t completed any product checkouts on the Freshpoint
          marketplace platform yet.
        </p>
        <Button asChild className="rounded-xl font-bold shadow-md">
          <Link href="/explore">Start Shopping Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time search filter row controls */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          placeholder="Search by vendor, month (e.g. July), day (e.g. 6), or weekday..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground font-medium">
          No records match your active search filters.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
