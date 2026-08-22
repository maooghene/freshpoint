// components/admin/BusinessRecentBookings.tsx
import { BusinessDetailData } from "@/lib/actions/admin-business-detail";

interface BookingsProps {
  bookings: BusinessDetailData["recentBookings"];
  totalCount: number;
}

export function BusinessRecentBookings({
  bookings,
  totalCount,
}: BookingsProps) {
  const compactCurrency = (val: number | null) => {
    if (val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
    }).format(val);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Recent Bookings ({totalCount})
      </h3>
      <div className="divide-y divide-border text-sm">
        {bookings.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">
            No structural booking records found.
          </p>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {b.user.firstName} {b.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(b.startTime).toLocaleDateString("en-NG", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className="font-bold block text-foreground"
                  title={`₦${b.totalAmount || 0}`}
                >
                  {compactCurrency(b.totalAmount)}
                </span>
                <span className="text-xs font-semibold capitalize text-muted-foreground">
                  {b.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
