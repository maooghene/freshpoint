import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { StaffOrdersClient } from "./StaffOrdersClient";

export default async function StaffOrdersPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  const userProfile = await prisma.user.findUnique({
    where: { clerkId },
    include: { staffProfile: true },
  });

  if (!userProfile?.staffProfile || !userProfile.staffProfile.isActive) {
    redirect("/");
  }

  const businessId = userProfile.staffProfile.businessId;

  // Pull active location store pipeline items for display tracking loops
  const orders = await prisma.order.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <main className="min-h-screen bg-background pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans w-full max-w-7xl mx-auto min-w-0">
      <div className="flex flex-col gap-1 border-b border-border pb-6 mb-8 min-w-0">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground truncate">
          {"Store Orders Pipeline"}
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-medium truncate">
          {"Monitor branch-wide commercial product sales, coordinate incoming checkouts, and verify retail processing statuses."}
        </p>
      </div>

      {/* Inject Interactive Table-Driven Client Engine */}
      <StaffOrdersClient initialOrders={orders} />
    </main>
  );
}
