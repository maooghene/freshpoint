"use client";

import { Button } from "@/components/ui/button";
import { PackageSearchIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import BusinessOrders from "@/components/business/orders/BusinessOrders"; // Updated path and naming to be industry-agnostic

export default function BusinessOrdersPage() {
  const router = useRouter();
  const params = useParams();

  // Captures the dynamic business tenant slug from the URL (e.g., 'boyzltd', 'powergym')
  const businessSlug = params?.slug as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageSearchIcon className="text-primary size-5" />
          <h2 className="text-xl font-bold text-foreground">
            Recent Product Orders
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-bold"
          onClick={() => router.push(`/business/${businessSlug}/orders`)}
          disabled={!businessSlug}
        >
          Full Order History
        </Button>
      </div>

      {/* Pass down the businessSlug to isolate order data fetching to this specific tenant */}
      <BusinessOrders businessSlug={businessSlug} />
    </div>
  );
}
