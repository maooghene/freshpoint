// src/app/(public)/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerBookingWidget from "@/components/public/booking/CustomerBookingWidget";

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicBusinessBookingPage({ params }: PublicPageProps) {
  const { slug } = await params;

  // 1. Fetch the business details from Prisma using the slug parameter
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true },
    include: {
      items: {
        where: { isActive: true, type: "SERVICE" }, // Fetch only active booking services
      },
    },
  });

  if (!business) {
    notFound();
  }

  // 2. Render the interactive client scheduling layout
  return (
    <div className="min-h-screen bg-background">
      <CustomerBookingWidget 
        business={JSON.parse(JSON.stringify(business))} 
      />
    </div>
  );
}
