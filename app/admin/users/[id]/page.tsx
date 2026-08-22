// app/admin/users/[id]/page.tsx
import { notFound } from "next/navigation";
import { getUserDetail } from "@/lib/actions/admin-user-detail";
import { UserDetailBanControl } from "@/components/admin/user-detail-ban-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const formatCurrency = (value: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getUserDetail(id);

  if (!data) notFound();
  const { user, auditEntries } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(user.createdAt).toLocaleDateString("en-NG")}
              </span>
            </div>
          </div>
          <UserDetailBanControl userId={user.id} isBanned={user.isBanned} />
        </div>
      </div>

      {/* Owned businesses */}
      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Owned Businesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No businesses owned.
            </p>
          ) : (
            <div className="space-y-2">
              {user.businesses.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/30"
                >
                  <Link
                    href={`/admin/businesses/${b.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {b.name}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={
                        b.isActive
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                          : "bg-destructive/10 text-destructive border-destructive/20 text-xs"
                      }
                    >
                      {b.isActive ? "Live" : "Frozen"}
                    </Badge>
                    {b.isPayoutFrozen && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                        Payout Frozen
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings */}
        <Card className="border-border bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Recent Bookings ({user.bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              user.bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-sm border-b border-border/60 pb-2 last:border-0"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {b.business.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.startTime).toLocaleDateString("en-NG")} ·{" "}
                      {b.status}
                    </div>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="border-border bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Recent Orders ({user.orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              user.orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between text-sm border-b border-border/60 pb-2 last:border-0"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {o.business.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{o.code} · {o.status}
                    </div>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(o.totalAmount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaints */}
      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Complaints Filed ({user.complaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No complaints filed.
            </p>
          ) : (
            user.complaints.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between text-sm border-b border-border/60 pb-2 last:border-0"
              >
                <span className="text-foreground">{c.summary}</span>
                <Badge variant="outline" className="text-xs">
                  {c.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Audit trail for this user */}
      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Admin Action History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No administrative actions recorded for this account.
            </p>
          ) : (
            auditEntries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between text-xs border-b border-border/60 pb-2 last:border-0"
              >
                <span className="text-foreground">
                  <span className="font-semibold">{e.actorName}</span>{" "}
                  {e.action.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("en-NG")}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
