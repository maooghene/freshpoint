import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import StaffSidebar from "@/components/business/staff/StaffSidebar";
import { StaffClearanceGate } from "./StaffClearanceGate"; // 🔓 Import our fail-safe client gateway cleaner

interface StaffLayoutProps {
  children: React.ReactNode;
}

export default async function StaffLayout({ children }: StaffLayoutProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  // Pull Clerk authentication record details for primary name tracking blocks
  const clerkUser = await currentUser();

  // Extract relational business parameters from matching postgres tables
  const userProfile = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      staffProfile: {
        include: {
          business: {
            select: { name: true, slug: true },
          },
        },
      },
    },
  });

  // Guard Boundary: Bounce out un-onboarded traffic from workforce sections
  if (!userProfile?.staffProfile || !userProfile.staffProfile.isActive) {
    redirect("/");
  }

  const staff = userProfile.staffProfile;

  return (
    <div className="relative min-h-screen bg-background flex w-full font-sans antialiased overflow-x-hidden">
      {/* 
        🔓 FAIL-SAFE MOUNT ENVELOPE:
        Wipes out local exit override tokens the second they are back on duty,
        preventing background onboarding checks from stalling permanently.
      */}
      <StaffClearanceGate />

      {/* 
        💎 THE SIDEBAR MOUNT ENGINE:
        Passes verified backend datasets cleanly straight down to your components 
      */}
      <StaffSidebar
        businessName={staff.business.name}
        businessSlug={staff.business.slug}
        user={{ firstName: clerkUser?.firstName }}
      />

      {/* 
        🎯 RESPONSIVE SPACER FRAMEWORK WITH MOBILE CLIPPING CORRECTION:
        pt-16 handles small screen header clearance, shifting cleanly to lg:pt-0 
        when the layout engine rolls over onto wide desktop viewports.
      */}
      <div className="flex-1 w-full min-w-0 pt-16 lg:pt-0 lg:pl-64 flex flex-col">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
