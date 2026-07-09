import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { StaffBookingsClient } from "./StaffBookingsClient";

export default async function StaffBookingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  const userProfile = await prisma.user.findUnique({
    where: { clerkId },
    include: { staffProfile: true },
  });

  if (!userProfile?.staffProfile || !userProfile.staffProfile.isActive) {
    redirect("/");
  }

  const staff = userProfile.staffProfile;

  // Query out all assigned appointment slots for this unique identity node
  const bookings = await prisma.booking.findMany({
    where: { staffId: staff.id },
    orderBy: { startTime: "asc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return (
    <main className="min-h-screen bg-background pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans w-full max-w-7xl mx-auto min-w-0">
      {/* Dynamic Header Block */}
      <div className="flex flex-col gap-1 border-b border-border pb-6 mb-8 min-w-0">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground truncate">
          {"My Bookings Portfolio"}
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-medium truncate">
          {
            "Review customer details, active assignment hours, and complete service queues assigned directly to you."
          }
        </p>
      </div>

      {/* Inject Interactive High-Utility Client Engine */}
      <StaffBookingsClient initialBookings={bookings} />
    </main>
  );
}
