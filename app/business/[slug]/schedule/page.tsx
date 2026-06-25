// src/app/business/[slug]/schedule/page.tsx
import { notFound } from "next/navigation";
import BusinessSchedule from "@/components/business/schedule/index"; // Pulls the heavy code

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SchedulePageRoute({ params }: PageProps) {
  // 1. Next.js reads the URL (e.g., /business/boyzltd/schedule) and grabs 'boyzltd'
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // 2. It displays the heavy component on the webpage and hands it the business slug
  return <BusinessSchedule businessSlug={slug} />;
}
