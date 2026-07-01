// app/business/[slug]/staff/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import StaffDashboard from "@/components/business/staff/StaffDashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StaffPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) notFound();

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

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Staff Management
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Manage your team, schedules, and specialist profiles.
        </p>
      </div>

      <StaffDashboard
        business={JSON.parse(JSON.stringify(business))}
        businessSlug={slug}
      />
    </div>
  );
}
