import * as React from "react";
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
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      {/* 💡 FIXED: Terminology simplified so that any shop owner can understand it instantly */}
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          My{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Items
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          See all your treatments, services, and products available in your shop
          dashboard list.
        </p>
      </div>

      {/* Render the clean, segmented architecture with the active business slug */}
      <ManageItemsDashboard businessSlug={slug} />
    </div>
  );
}
