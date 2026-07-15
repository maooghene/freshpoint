// app/admin/page.tsx
import { getPlatformAnalyticsMetrics } from "@/lib/actions/admin-analytics";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminPerformanceCharts from "./AdminPerformanceCharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Store,
  ShoppingBag,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const data = await getPlatformAnalyticsMetrics();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(value);

  const formatCurrencyCompact = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Platform Overview
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Real-time transactional insights and marketplace operations telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 w-full min-w-0">
        <AdminStatCard
          title="Total Marketplace Gross"
          value={formatCurrencyCompact(data.totalGrossRevenue)}
          fullValue={formatCurrency(data.totalGrossRevenue)}
          description="Combined orders & bookings"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          sparkline={data.revenueSparkline}
        />
        <AdminStatCard
          title="FreshPoint Net Revenue"
          value={formatCurrencyCompact(data.platformCommissionsGross)}
          fullValue={formatCurrency(data.platformCommissionsGross)}
          description="Net platform commission"
          icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
          sparkline={data.revenueSparkline}
        />
        <AdminStatCard
          title="Active Vendor Footprint"
          value={data.totalBusinesses}
          description={`${data.pendingBusinesses} awaiting verification`}
          icon={<Store className="w-5 h-5 text-sky-500" />}
          sparkline={data.vendorSparkline}
        />
        <AdminStatCard
          title="Open Complaints"
          value={data.activeComplaintsCount}
          description="Requires immediate action"
          icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
          sparkline={data.complaintsSparkline}
        />
      </div>

      <AdminPerformanceCharts data={data.chartData} />

      <div className="grid gap-5 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight">
              Channel Split Summary
            </CardTitle>
            <CardDescription>
              Comparative data across storefront segments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Product Sales & Deliveries
                </div>
                <span className="font-semibold">
                  {formatCurrency(data.aggregateOrderGross)}
                </span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${data.totalGrossRevenue > 0 ? (data.aggregateOrderGross / data.totalGrossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Includes {formatCurrency(data.aggregateDeliveryGross)} delivery
                surcharge revenues.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <CalendarDays className="h-4 w-4 text-sky-500" />
                  Service Bookings
                </div>
                <span className="font-semibold">
                  {formatCurrency(data.aggregateBookingGross)}
                </span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{
                    width: `${data.totalGrossRevenue > 0 ? (data.aggregateBookingGross / data.totalGrossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalVolumeCount} total transactions across the platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight">
              App Server Status
            </CardTitle>
            <CardDescription>
              Check if everything is working fine behind the scenes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-3">
              {[
                ["Database Sync Connection", "Working"],
                ["User Login Security Gate", "Safe"],
                ["Main Database Storage Pool", "Connected"],
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-muted-foreground font-medium">
                    {label}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
