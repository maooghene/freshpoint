"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// Full-screen notice shown to everyone except admins while maintenance mode is
// on. Sign-in and admin pages stay reachable so an admin can still get in and
// switch it off.
export default function MaintenanceNotice() {
  const pathname = usePathname() ?? "";
  const [message, setMessage] = React.useState<string | null>(null);

  const exempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  React.useEffect(() => {
    if (exempt) return;
    let alive = true;
    fetch("/api/platform/checkout-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { maintenance?: boolean; message?: string } | null) => {
        if (alive) setMessage(data?.maintenance ? (data.message ?? "") : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [exempt, pathname]);

  if (exempt || !message) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        We&apos;ll be right back
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
