// components/admin/BusinessAuditTrail.tsx
import { BusinessDetailData } from "@/lib/actions/admin-business-detail";

interface AuditProps {
  logs: BusinessDetailData["auditLogs"];
}

export function BusinessAuditTrail({ logs }: AuditProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Vendor Operational Audit History
      </h3>
      <div className="divide-y divide-border text-sm">
        {logs.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">
            No system logs registered under Vendor target profile.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  Authorized Actor:{" "}
                  <span className="font-semibold text-foreground">
                    {log.actorName}
                  </span>
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("en-NG", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
