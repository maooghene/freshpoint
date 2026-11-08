"use client";

import * as React from "react";
import { MobileTopBar } from "@/components/dashboard/MobileTopBar";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminMobileDrawer from "./AdminMobileDrawer";

export default function AdminShell({
  children,
  openComplaintCount = 0,
}: {
  children: React.ReactNode;
  openComplaintCount?: number;
}) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Re-fetch the server layout every minute so new complaints show up in the
  // badge without a manual page reload.
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full relative">
        <AdminSidebar openComplaintCount={openComplaintCount} />
        <AdminMobileDrawer
          isOpen={isMobileOpen}
          setIsOpen={setIsMobileOpen}
          openComplaintCount={openComplaintCount}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <MobileTopBar
            onOpenMenu={() => setIsMobileOpen(true)}
            subtitle="Admin"
            menuLabel="Open admin menu"
          />

          <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto bg-background/40 custom-scrollbar">
            <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-200">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
