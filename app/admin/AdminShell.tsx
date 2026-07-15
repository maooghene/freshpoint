"use client";

import * as React from "react";
import { MenuIcon } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminMobileDrawer from "./AdminMobileDrawer";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full relative">
        <AdminSidebar />
        <AdminMobileDrawer isOpen={isMobileOpen} setIsOpen={setIsMobileOpen} />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile Top Bar */}
          <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0 min-w-0 w-full h-14">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 border border-border rounded-xl bg-secondary/50 text-foreground shrink-0"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1 px-4 text-center">
              <span className="font-bold text-sm text-foreground truncate block">
                FreshPoint Admin
              </span>
            </div>
            <div className="w-9 h-9 shrink-0" />
          </div>

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
