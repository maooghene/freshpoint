// app/admin/complaints/page.tsx
import { getAllPlatformComplaints } from "@/lib/actions/admin-complaints";
import { ComplaintCard } from "@/components/admin/complaint-card";

export const revalidate = 0;

export default async function AdminComplaintsPage() {
  const complaints = await getAllPlatformComplaints();

  const openTickets = complaints.filter((c) => c.status !== "RESOLVED");
  const resolvedTickets = complaints.filter((c) => c.status === "RESOLVED");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Support & Grievance Console
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Monitor marketplace friction points, track order issues, and manage
          resolution statuses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Active Incidents ({openTickets.length})
          </h2>
          {openTickets.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-8 text-center bg-card">
              Clear queues. No operational incidents are active on the platform.
            </div>
          ) : (
            openTickets.map((c) => <ComplaintCard key={c.id} complaint={c} />)
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Historical Resolutions ({resolvedTickets.length})
          </h2>
          {resolvedTickets.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-8 text-center bg-card">
              No historical incident traces found in system log lines.
            </div>
          ) : (
            resolvedTickets.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
