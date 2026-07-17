// app/admin/audit-log/page.tsx
import { getAuditLog } from "@/lib/actions/admin-audit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

function actionStyle(action: string) {
  if (action.startsWith("BAN"))
    return "bg-destructive/10 text-destructive border-destructive/20";
  if (action.startsWith("UNBAN") || action.startsWith("APPROVE"))
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  return "bg-primary/10 text-primary border-primary/20";
}

export default async function AdminAuditLogPage() {
  const entries = await getAuditLog();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Audit Log
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Full record of administrative actions taken across the platform.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardContent className="pt-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Actor</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Target
                  </TableHead>
                  <TableHead className="text-xs font-semibold">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground h-24"
                    >
                      No administrative actions recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/40">
                      <TableCell className="text-sm font-semibold text-foreground">
                        {e.actorName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-semibold ${actionStyle(e.action)}`}
                        >
                          {e.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.targetType} ·{" "}
                        {e.targetLabel ?? e.targetId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString("en-NG")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
