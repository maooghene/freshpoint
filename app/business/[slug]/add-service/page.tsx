// src/app/business/[slug]/add-service/page.tsx
import { notFound } from "next/navigation";
import FreshpointAddItemDashboard from "@/components/business/add-items/index";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AddItemPageRoute({ params }: PageProps) {
  // Capture the business workspace slug parameter from the URL path
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // Render the organized layout, handing it the businessSlug to secure multi-tenancy
  return (
    <div className="container mx-auto p-6">
      <FreshpointAddItemDashboard businessSlug={slug} />
    </div>
  );
}
