"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboardIcon,
  CalendarCheckIcon,
  ClockIcon,
  PlusCircleIcon,
  LayersIcon,
  MenuIcon,
  UsersIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";
import { useState, useEffect } from "react";

interface BusinessLayoutProps {
  children: React.ReactNode;
  businessSlug: string;
}

interface BusinessInfo {
  name: string;
  image: string | null;
  status: string;
}

export default function BusinessLayout({
  children,
  businessSlug,
}: BusinessLayoutProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/businesses/slug/${businessSlug}`);
        if (!res.ok) return;
        const data = await res.json();
        setBusinessInfo({
          name: data.name,
          image: data.image,
          status: data.status,
        });
      } catch (err) {
        console.error("Failed to fetch business info:", err);
      }
    };

    if (businessSlug) fetchBusiness();
  }, [businessSlug]);

  const navigationItems = [
    {
      name: "Dashboard",
      href: `/business/${businessSlug}`,
      icon: LayoutDashboardIcon,
      exact: true,
    },
    {
      name: "Bookings",
      href: `/business/${businessSlug}/bookings`,
      icon: CalendarCheckIcon,
    },
    {
      name: "Business Hours",
      href: `/business/${businessSlug}/schedule`,
      icon: ClockIcon,
    },
    {
      name: "Add New Item",
      href: `/business/${businessSlug}/add-service`,
      icon: PlusCircleIcon,
    },
    {
      name: "Manage Catalog",
      href: `/business/${businessSlug}/manage-items`,
      icon: LayersIcon,
    },
    {
      name: "Staff",
      href: `/business/${businessSlug}/staff`,
      icon: UsersIcon,
    },
    {
      name: "Settings",
      href: `/business/${businessSlug}/settings`,
      icon: SettingsIcon,
    },
  ];

  const checkActive = (item: (typeof navigationItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    // 1️⃣ Fix: Stripped pt-16 and set strict viewport bounding properties to eliminate page gaps
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* 2️⃣ Fix: Added a transparent header spacer to safely map around your global fixed top app navbar */}
      <div className="h-16 w-full shrink-0" />

      {/* INNER DASHBOARD PANEL LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full relative">
        {/* MOBILE HEADER */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-card border-b border-border z-20 shrink-0 w-full">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <span className="font-black text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate max-w-[180px]">
              {businessInfo?.name || "FreshPoint"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 border border-border rounded-xl bg-secondary/50 text-foreground cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* SIDEBAR */}
        {/* 3️⃣ Fix: Cleaned layout definitions so sidebar fills the layout canvas area perfectly without extra scroll paddings */}
        <aside
          className={`
          fixed inset-y-16 left-0 transform ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:inset-y-0 md:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 bg-card border-r border-border flex flex-col p-6 z-30 md:z-10 shrink-0 h-full
        `}
        >
          {/* LOGO / BUSINESS NAME */}
          <div className="hidden md:flex flex-col gap-1 mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary shrink-0" />
              <span className="font-black text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                {businessInfo?.name || "FreshPoint"}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  businessInfo?.status === "approved"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {businessInfo?.status === "approved" ? "● Active" : "● Pending"}
              </span>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navigationItems.map((item) => {
              const isActive = checkActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* PROFILE FOOTER */}
          <div className="hidden md:flex items-center gap-3 pt-4 border-t border-border mt-auto shrink-0">
            <UserButton />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                Business Owner
              </span>
            </div>
          </div>
        </aside>

        {/* MOBILE BACKDROP */}
        {isMobileOpen && (
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* WIDESCREEN CONTENT VIEWPORT (SCROLLS INDEPENDENTLY) */}
        {/* 4️⃣ Fix: Added 'overflow-y-auto' strictly to the main display element. Now your content scrolls while your navbar and sidebar stay firmly in place! */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto h-full bg-background/40">
          <div className="w-full h-full animate-in fade-in duration-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
