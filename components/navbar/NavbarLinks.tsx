"use client";

import * as React from "react";
import { LandingLinks } from "./LandingLinks";
import { BusinessLinks } from "./BusinessLinks";
import { MarketplaceLinks } from "./MarketplaceLinks";

interface NavbarLinksProps {
  showAppNavbar: boolean;
  isCurrentlyInBusinessDashboard: boolean;
  businessId: string;
  pathSegments: string[];
}

export function NavbarLinks({
  showAppNavbar,
  isCurrentlyInBusinessDashboard,
  businessId,
  pathSegments,
}: NavbarLinksProps) {
  if (!showAppNavbar) {
    return <LandingLinks />;
  }

  if (isCurrentlyInBusinessDashboard && businessId) {
    return (
      <BusinessLinks businessId={businessId} pathSegments={pathSegments} />
    );
  }

  return <MarketplaceLinks />;
}
