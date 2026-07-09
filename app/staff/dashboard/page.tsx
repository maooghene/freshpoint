import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { StaffDashboardClient } from "./StaffDashboardClient";

export default async function StaffDashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  // Find profile records matching the user session
  const userProfile = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      staffProfile: {
        include: {
          business: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  // Security Intercept Guard: If not verified workforce, redirect out cleanly
  if (!userProfile?.staffProfile || !userProfile.staffProfile.isActive) {
    redirect("/");
  }

  const staff = userProfile.staffProfile;
  const businessId = staff.businessId;

  // Dual-Track Atomic Parallel Queries
  const [personalBookings, sharedStoreOrders] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId,
        // ✅ FIXED: Replaced staffProfileId with your actual schema database column identifier (staffId)
        staffId: staff.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.order.findMany({
      where: { businessId },
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans w-full max-w-7xl mx-auto min-w-0">
      <div className="flex flex-col gap-1 border-b border-border pb-6 mb-8 min-w-0">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/5 rounded-full border border-primary/10 w-fit">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {staff.business.name} {"Workforce Portal"}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground truncate mt-2">
          {"Welcome back, "} {userProfile.firstName || "Team Member"}
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-medium truncate">
          {
            "Track your personal assigned appointments, view queue codes, and coordinate active retail checkout pipelines."
          }
        </p>
      </div>

      <StaffDashboardClient
        staffId={staff.id}
        initialBookings={personalBookings}
        initialOrders={sharedStoreOrders}
      />
    </main>
  );
}
