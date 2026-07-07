import React from "react";

export interface BusinessInfo {
  name: string;
  image: string | null;
  status: string;
}

export interface NavigationItemShape {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}
