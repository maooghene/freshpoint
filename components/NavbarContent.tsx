"use client";

import * as React from "react";
import Link from "next/link";
import { FreshpointLogo } from "@/components/icons/FreshpointLogo";
import { useNavbarRouting } from "./navbar/useNavbarRouting";
import { NavbarLinks } from "./navbar/NavbarLinks";
import { NavbarActions } from "./navbar/NavbarActions";

export function NavbarContent() {
  const {
    pathSegments,
    isCurrentlyInBusinessDashboard,
    businessId,
    hasBusinessAccess,
    merchantDashboardHref,
    showAppNavbar,
  } = useNavbarRouting();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-6 border-b border-border bg-background h-16 flex items-center select-none">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center gap-4">
        {/* LOGO CONTAINER LINK */}
        <Link
          href={
            isCurrentlyInBusinessDashboard && businessId
              ? `/business/${businessId}`
              : "/"
          }
          className="flex items-center gap-2 shrink-0"
        >
          <FreshpointLogo size={50} />
          {isCurrentlyInBusinessDashboard && (
            <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded text-muted-foreground font-mono">
              Biz
            </span>
          )}
        </Link>

        {/* MIDSECTION CONTEXT-AWARE NAVIGATION ACTIONS */}
        {/* <NavbarLinks
          showAppNavbar={showAppNavbar}
          isCurrentlyInBusinessDashboard={isCurrentlyInBusinessDashboard}
          businessId={businessId}
          pathSegments={pathSegments}
        /> */}

        {/* ACTIONS & AUTHENTICATION SECTOR */}
        <NavbarActions
          isCurrentlyInBusinessDashboard={isCurrentlyInBusinessDashboard}
          businessId={businessId}
          hasBusinessAccess={hasBusinessAccess}
          merchantDashboardHref={merchantDashboardHref}
        />
      </div>
    </nav>
  );
}
