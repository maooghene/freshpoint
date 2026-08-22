// components/admin/user-search-table.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlatformUserRow,
  searchPlatformUsers,
} from "@/lib/actions/admin-users";
import { toggleCustomerBanAction } from "@/lib/actions/admin-complaints";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, ShieldCheck, Link2 } from "lucide-react";

interface UserSearchTableProps {
  initialUsers: PlatformUserRow[];
  initialQuery: string;
}

export function UserSearchTable({
  initialUsers,
  initialQuery,
}: UserSearchTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [users, setUsers] = useState(initialUsers);
  const [isSearching, startSearch] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const runSearch = (value: string) => {
    setQuery(value);
    startSearch(async () => {
      const results = await searchPlatformUsers(value);
      setUsers(results);
      router.replace(
        value ? `/admin/users?q=${encodeURIComponent(value)}` : "/admin/users",
        { scroll: false },
      );
    });
  };

  const handleBanToggle = async (userId: string, currentlyBanned: boolean) => {
    setPendingId(userId);
    const response = await toggleCustomerBanAction(userId, !currentlyBanned);
    if (response.success) {
      const refreshed = await searchPlatformUsers(query);
      setUsers(refreshed);
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
    setPendingId(null);
  };

  return (
    <Card className="border-border bg-card shadow-sm rounded-2xl">
      <CardContent className="pt-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 bg-background max-w-sm text-foreground"
          />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              {/* Added divide-x to horizontally segment header fields */}
              <TableRow className="divide-x divide-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  User / Email
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Business
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Activity
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Joined
                </TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground h-24"
                  >
                    Searching...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground h-24"
                  >
                    No accounts match that search.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  /* Added divide-x matrix mapping parameters to the body rows */
                  <TableRow
                    key={u.id}
                    className="hover:bg-muted/40 border-b border-border divide-x divide-border transition-colors"
                  >
                    <TableCell>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-semibold text-sm text-primary hover:underline"
                      >
                        {u.email}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {u.firstName} {u.lastName || ""}
                    </TableCell>
                    <TableCell>
                      {u.businesses.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No business
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {u.businesses.map((b) => (
                            <div
                              key={b.id}
                              className="flex items-center gap-1.5"
                            >
                              <Link
                                href={`/admin/businesses/${b.id}`}
                                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>{b.name}</span>
                                <Link2 className="h-2.5 w-2.5 opacity-60" />
                              </Link>
                              {b.isActive ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  Live
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                                  Frozen
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u._count.bookings} bookings · {u._count.orders} orders
                    </TableCell>
                    <TableCell>
                      {u.isBanned ? (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold text-xs shadow-none">
                          BANNED
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold text-xs shadow-none">
                          ACTIVE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-NG")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === u.id}
                        onClick={() => handleBanToggle(u.id, u.isBanned)}
                        className={
                          u.isBanned
                            ? "text-emerald-600 hover:bg-emerald-500/10 gap-1.5 text-xs font-semibold cursor-pointer"
                            : "text-destructive hover:bg-destructive/10 gap-1.5 text-xs font-semibold cursor-pointer"
                        }
                      >
                        {u.isBanned ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Unban
                          </>
                        ) : (
                          <>
                            <Ban className="h-3.5 w-3.5" /> Ban
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
