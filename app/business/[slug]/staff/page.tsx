import * as React from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
// Standardized named connection instance wrapper
import { prisma } from "@/lib/prisma";
import StaffDashboard from "@/components/business/staff/StaffDashboard";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StaffPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) notFound();

  const systemUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!systemUser) notFound();

  // Resolve the business profile along with its full nested staff structure
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      staff: {
        include: {
          schedules: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!business) notFound();

  // Verify absolute ownership guard rails to prevent cross-tenant leaks
  // (allows real owner, real rostered staff, or a verified admin impersonation session)
  const authorized = await authorizeBusinessAccess({
    businessId: business.id,
    ownerId: business.ownerId,
    systemUserId: systemUser.id,
    allowStaff: false,
  });

  if (!authorized) notFound();

  // Safe JSON serialization to cleanly pass Date timestamps to Client Component trees
  const serializedBusiness = JSON.parse(JSON.stringify(business));

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* SEAMLESS HEADER LAYOUT */}
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Team{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Roster
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Onboard new professionals, assign service roles, and manage workspace
          permissions.
        </p>
      </div>

      {/* Renders your refactored dashboard component smoothly passing business parameters */}
      <StaffDashboard
        business={serializedBusiness}
        businessId={serializedBusiness.id}
        businessSlug={slug}
      />
    </div>
  );
}
