// src/app/business/[slug]/page.tsx
import { notFound } from "next/navigation";
import BusinessDashboard from "@/components/business/dashboard/index";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessDashboardRootPage({ params }: PageProps) {
  // Pull the unique tenant string directly out of the application segment param
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // Render the dashboard grid passing context along down into our state hooks
  return (
    <div className="p-6">
      <BusinessDashboard businessSlug={slug} />
    </div>
  );
}
