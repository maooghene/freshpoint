"use client";

import * as React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarRange, ClipboardList, Search } from "lucide-react";

import { MetricsGrid } from "./MetricsGrid";
import { PersonalBookingsList } from "./PersonalBookingsList";
import { SharedStoreOrdersList } from "./SharedStoreOrdersList";

export interface DashboardUserPayload {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface ClientBookingDataShape {
  id: string;
  businessId: string;
  // ✅ Formatted strictly to pair with incoming Prisma query objects
  staffId: string | null;
  status: string;
  totalAmount: number | null;
  createdAt: Date;
  startTime?: Date | null;
  user: DashboardUserPayload | null;
}

export interface ClientOrderDataShape {
  id: string;
  businessId: string;
  status: string;
  totalAmount: number | null;
  createdAt: Date;
  user: DashboardUserPayload | null;
}

interface StaffDashboardClientProps {
  staffId: string;
  initialBookings: ClientBookingDataShape[];
  initialOrders: ClientOrderDataShape[];
}

export function StaffDashboardClient({
  staffId,
  initialBookings,
  initialOrders,
}: StaffDashboardClientProps) {
  const [search, setSearch] = useState<string>("");

  return (
    <div className="space-y-8 w-full min-w-0">
      {/* Dynamic Performance Matrix Tiers */}
      <MetricsGrid bookings={initialBookings} orders={initialOrders} />

      {/* Primary Workforce Data Console Tabs */}
      <Tabs defaultValue="bookings" className="w-full min-w-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4 min-w-0">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-10 w-full sm:w-auto grid grid-cols-2 max-w-sm">
            <TabsTrigger
              value="bookings"
              className="rounded-lg text-xs font-bold gap-2"
            >
              <CalendarRange className="h-3.5 w-3.5 shrink-0" />
              {"My Appointments"}
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-lg text-xs font-bold gap-2"
            >
              <ClipboardList className="h-3.5 w-3.5 shrink-0" />
              {"Store Orders"}
            </TabsTrigger>
          </TabsList>

          {/* Interactive Live Context Filtering Core */}
          <div className="relative flex items-center bg-card border border-border rounded-xl px-3 py-2 focus-within:border-primary w-full sm:w-64 shrink-0 shadow-xs">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search user names, logs or IDs..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full min-w-0"
            />
          </div>
        </div>

        <TabsContent
          value="bookings"
          className="outline-none focus:ring-0 mt-0"
        >
          <PersonalBookingsList bookings={initialBookings} search={search} />
        </TabsContent>

        <TabsContent value="orders" className="outline-none focus:ring-0 mt-0">
          <SharedStoreOrdersList orders={initialOrders} search={search} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
