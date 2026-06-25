// src/app/business/[slug]/bookings/page.tsx
import { notFound } from "next/navigation";
import FreshpointBookingsDashboard from "@/components/business/bookings/index";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingsPageRoute({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <FreshpointBookingsDashboard businessSlug={slug} />;
}
