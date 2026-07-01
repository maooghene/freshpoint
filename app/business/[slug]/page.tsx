// src/app/business/[slug]/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { Banknote, CalendarCheck2, Users, Layers } from "lucide-react";

// 🛠️ STEP 1: IMPORT THE STATCARD COMPONENT CORRECTLY USING YOUR GLOBAL ALIAS PATH
import StatCard from "@/components/business/dashboard/StatCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) notFound();

  // Fetch the business details scoped to the slug parameter matrix
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      staff: true,
      items: true,
      bookings: true,
    },
  });

  if (!business) notFound();

  // 2️⃣ SERVER SIDE CALCULATIONS: Aggregate metrics cleanly before rendering cards
  const totalStaffCount = business.staff.length;
  const totalServicesCount = business.items.length;

  // Calculate aggregate revenue fields collected from active completed bookings
  const rawRevenue = business.bookings
    .filter((b) => b.status === BookingStatus.COMPLETED)
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const formattedRevenue = `₦${rawRevenue.toLocaleString()}`;

  const activeBookingsCount = business.bookings.filter(
    (b) =>
      b.status === BookingStatus.CONFIRMED ||
      b.status === BookingStatus.PENDING,
  ).length;

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* SECTION HEADER ROW */}
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Workspace{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Overview
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Monitor your real-time analytics indicators, revenue yields, and
          active staff counts.
        </p>
      </div>

      {/* 🛠️ STEP 3: RENDER THE CARDS IN A BEAUTIFUL RESPONSIVE TW-GRID COMPONENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* TOTAL REVENUE EARNED METRIC CARD */}
        <StatCard
          title="Total Revenue"
          value={formattedRevenue}
          icon={Banknote}
          color="text-emerald-500"
        />

        {/* ACTIVE APPOINTMENTS PLACED CARD */}
        <StatCard
          title="Active Bookings"
          value={activeBookingsCount}
          icon={CalendarCheck2}
          color="text-primary"
        />

        {/* TEAM MEMBERS ROSTER COUNT CARD */}
        <StatCard
          title="Active Staff"
          value={totalStaffCount}
          icon={Users}
          color="text-sky-500"
        />

        {/* CATALOG OFFERINGS/SERVICES INVENTORY CARD */}
        <StatCard
          title="Total Services"
          value={totalServicesCount}
          icon={Layers}
          color="text-amber-500"
        />
      </div>

      {/* REMAINDER OF YOUR MAIN DASHBOARD LOWER MODULE GRIDS (Chart plots, recent activities list, etc.) */}
      <div className="p-12 border border-dashed rounded-3xl text-center bg-secondary/10 border-border text-xs font-semibold text-muted-foreground">
        📊 Multi-tenant performance tracking maps will mount cleanly right
        underneath your metric summaries card dashboard area.
      </div>
    </div>
  );
}
