// src/app/business/[slug]/manage-items/page.tsx
import { notFound } from "next/navigation";
import ManageItemsDashboard from "@/components/business/manage-items/index";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ManageItemsPageRoute({ params }: PageProps) {
  // Capture the dynamic tenant identifier (e.g., 'boyzltd') from the URL
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Catalog Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure and manage your inventory products and bookable services.
        </p>
      </div>

      {/* Render the clean, segmented architecture with the active business slug */}
      <ManageItemsDashboard businessSlug={slug} />
    </div>
  );
}
