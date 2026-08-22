// app/admin/businesses/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBusinessDetail } from "@/lib/actions/admin-business-detail";
import { BusinessDetailControls } from "@/components/admin/BusinessDetailControls";
import { BusinessRecentBookings } from "@/components/admin/BusinessRecentBookings";
import { BusinessRecentOrders } from "@/components/admin/BusinessRecentOrders";
import { BusinessAuditTrail } from "@/components/admin/BusinessAuditTrail";
import { ImpersonateTriggerButton } from "@/components/admin/ImpersonateTriggerButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const business = await getBusinessDetail(resolvedParams.id);

  if (!business) {
    notFound();
  }

  const compactCurrency = (val: number | null) => {
    if (val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
    }).format(val);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto text-foreground">
      {/* Visual Anchor Context Entry Link */}
      <div>
        <Link
          href="/admin/businesses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Verification Management</span>
        </Link>
      </div>

      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {business.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage operational capabilities, logistical parameters, and risk
            profile.
          </p>
        </div>
        <ImpersonateTriggerButton businessId={business.id} />
        <BusinessDetailControls
          businessId={business.id}
          currentStatus={business.status}
          isPayoutFrozen={business.isPayoutFrozen}
        />
      </div>

      {/* Flat Metadata Rows Matrix */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          Core Structural Overview
        </h2>
        <div className="divide-y divide-border text-sm">
          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <span className="font-semibold text-foreground">
              Verification Profile Status
            </span>
            <span className="md:col-span-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  business.status === "approved"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {business.status}
              </span>
            </span>
          </div>

          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <span className="font-semibold text-foreground">
              Payout Liquidity Status
            </span>
            <span className="md:col-span-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  business.isPayoutFrozen
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {business.isPayoutFrozen ? "Frozen" : "Liquid / Active"}
              </span>
            </span>
          </div>

          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <span className="font-semibold text-foreground">
              Primary Platform Owner
            </span>
            <span className="md:col-span-2">
              <Link
                href={`/admin/users/${business.owner.id}`}
                className="text-primary hover:underline font-medium transition"
              >
                {business.owner.firstName} {business.owner.lastName} (
                {business.owner.email})
              </Link>
            </span>
          </div>

          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <span className="font-semibold text-foreground">
              Logistical Fees Matrix
            </span>
            <span className="md:col-span-2 text-foreground">
              Base: {compactCurrency(business.baseDeliveryFee)} • Per Km:{" "}
              {compactCurrency(business.deliveryFeePerKm)}
            </span>
          </div>

          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <span className="font-semibold text-foreground">
              Contact Identifiers
            </span>
            <span className="md:col-span-2 text-muted-foreground">
              {business.email} | {business.phone}
            </span>
          </div>

          <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <span className="font-semibold text-foreground">
              Physical Location Hub
            </span>
            <span className="md:col-span-2 text-muted-foreground">
              {business.address}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Split Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BusinessRecentBookings
          bookings={business.recentBookings}
          totalCount={business._count.bookings}
        />
        <BusinessRecentOrders
          orders={business.recentOrders}
          totalCount={business._count.orders}
        />
      </div>

      {/* Audit History Timeline Segment */}
      <BusinessAuditTrail logs={business.auditLogs} />
    </div>
  );
}
