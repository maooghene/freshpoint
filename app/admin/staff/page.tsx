// app/admin/staff/page.tsx
import {
  getPlatformAdminCrewList,
  provisionPlatformAdminAction,
  togglePlatformStaffStatusAction,
} from "@/lib/actions/admin-staff-management";
import { PlatformAdminRole } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserMinus, UserCheck } from "lucide-react";

export const revalidate = 0;

export default async function AdminStaffPage() {
  const crew = await getPlatformAdminCrewList();

  async function handleAddStaffSubmit(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const role = formData.get("role") as PlatformAdminRole;

    if (email && role) {
      await provisionPlatformAdminAction(email, role);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Platform Operations Crew
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Delegate granular system responsibilities, assign support agents, and
          monitor active operational permissions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Left Side: Assign Operator Form Block */}
        <Card className="md:col-span-1 border-border bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Invite Platform Operator
            </CardTitle>
            <CardDescription>
              Grant target privileges to an existing user account email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleAddStaffSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Account Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="operator@freshpoint.com"
                  required
                  className="text-sm bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-semibold">
                  Assigned System Role
                </Label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full text-sm rounded-lg border border-input bg-background p-2 text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="SUPPORT_AGENT">
                    Support Agent (Tickets Only)
                  </option>
                  <option value="LOGISTICS_AUDITOR">
                    Logistics Auditor (Delivery Rates)
                  </option>
                  <option value="PLATFORM_MANAGER">
                    Platform Manager (Full Operations)
                  </option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-bold gap-2 mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
              >
                <ShieldCheck className="h-4 w-4" /> Initialize Operator Access
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: Operational Directory Tracking Board Block */}
        <Card className="md:col-span-2 border-border bg-card shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Active Operators Registry
            </CardTitle>
            <CardDescription>
              Monitor assigned permission contexts across the application panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">
                      User Details
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Assigned Authorization
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crew.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-xs text-muted-foreground h-24"
                      >
                        No team roles have been assigned yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    crew.map((member) => (
                      <TableRow
                        key={member.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell>
                          <div className="font-semibold text-sm text-foreground">
                            {member.user.firstName}{" "}
                            {member.user.lastName || "Operator"}
                          </div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {member.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs font-mono font-medium px-2 py-0.5 border-border bg-muted/40"
                          >
                            {member.adminRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 font-semibold text-xs">
                              ACTIVE
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold text-xs">
                              SUSPENDED
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <form
                            action={async () => {
                              "use server";
                              await togglePlatformStaffStatusAction(
                                member.id,
                                !member.isActive,
                              );
                            }}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className={`h-8 w-8 ${
                                member.isActive
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-emerald-600 hover:bg-emerald-500/10"
                              }`}
                            >
                              {member.isActive ? (
                                <UserMinus className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </form>
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
    </div>
  );
}
