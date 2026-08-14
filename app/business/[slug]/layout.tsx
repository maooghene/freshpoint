"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  LayoutDashboardIcon,
  CalendarCheckIcon,
  ClockIcon,
  PlusCircleIcon,
  HelpCircleIcon,
  MenuIcon,
  UsersIcon,
  SettingsIcon,
  LayersIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "lucide-react";
import { AnnouncementsDisplay } from "@/components/announcements/AnnouncementsDisplay";

import { NavigationItemShape, BusinessInfo } from "./types";
import DesktopSidebar from "./DesktopSidebar";
import MobileDrawer from "./MobileDrawer";
import { BusinessAiAssistant } from "@/components/BusinessAiAssistant";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);

  const businessSlug = params?.slug || "";

  useEffect(() => {
    if (!businessSlug || businessSlug === "undefined") return;
    let isMounted = true;

    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/businesses/slug/${businessSlug}`, {
          cache: "no-store",
        });
        if (res.status === 403 || res.status === 401) {
          router.replace("/");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();

        if (isMounted) {
          setBusinessInfo({
            id: data.id ? String(data.id) : businessSlug,
            name: String(data.name || "FreshPoint Workspace"),
            image: data.image ? String(data.image) : null,
            status: data.status ? String(data.status) : "pending",
          });
        }
      } catch (err) {
        console.error("Failed to fetch business info:", err);
      }
    };

    void fetchBusiness();
    return () => {
      isMounted = false;
    };
  }, [businessSlug, router]);

  const navigationItems: NavigationItemShape[] = [
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
      name: "Orders",
      href: `/business/${businessSlug}/orders`,
      icon: ShoppingBagIcon,
    },
    {
      name: "Business Hours",
      href: `/business/${businessSlug}/schedule`,
      icon: ClockIcon,
    },
    {
      name: "My Items",
      href: `/business/${businessSlug}/manage-items`,
      icon: LayersIcon,
    },
    {
      name: "Add New Item",
      href: `/business/${businessSlug}/add-service`,
      icon: PlusCircleIcon,
    },
    { name: "Staff", href: `/business/${businessSlug}/staff`, icon: UsersIcon },
    {
      name: "Settings",
      href: `/business/${businessSlug}/settings`,
      icon: SettingsIcon,
    },
    {
      name: "Subscription",
      href: `/business/${businessSlug}/subscription`,
      icon: SparklesIcon,
    },
    {
      name: "Contact Support",
      href: `/contact`,
      icon: HelpCircleIcon,
    },
  ];

  const checkActive = (item: NavigationItemShape) => {
    if (!businessSlug) return false;
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  };

  const isApproved =
    businessInfo?.status?.trim().toLowerCase() === "approved" ||
    businessInfo?.status?.trim().toLowerCase() === "verified";

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full relative">
        {/* Isolated Desktop Sidebar Fragment */}
        <DesktopSidebar
          businessInfo={businessInfo}
          isApproved={isApproved}
          navigationItems={navigationItems}
          checkActive={checkActive}
          theme={theme}
          setTheme={setTheme}
          user={user}
        />

        {/* Isolated Mobile Drawer Fragment */}
        <MobileDrawer
          isOpen={isMobileOpen}
          setIsOpen={setIsMobileOpen}
          businessInfo={businessInfo}
          navigationItems={navigationItems}
          checkActive={checkActive}
          theme={theme}
          setTheme={setTheme}
          user={user}
        />

        {/* Viewport content layout frame lanes */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile Top Bar */}
          <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0 min-w-0 w-full h-14">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 border border-border rounded-xl bg-secondary/50 text-foreground cursor-pointer shrink-0"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1 px-4 text-center">
              <span className="font-bold text-sm text-foreground truncate block">
                {businessInfo?.name || "Workspace"}
              </span>
            </div>
            <div className="w-9 h-9 shrink-0" />
          </div>

          <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto bg-background/40 custom-scrollbar">
            <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-200">
              <AnnouncementsDisplay businessId={businessInfo?.id} />
              {children}
              <BusinessAiAssistant />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
