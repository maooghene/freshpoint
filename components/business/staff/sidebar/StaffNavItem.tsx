// components/business/staff/sidebar/StaffNavItem.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StaffNavItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  onItemClick: () => void;
}

export default function StaffNavItem({
  name,
  href,
  icon: IconComponent,
  isActive,
  onItemClick,
}: StaffNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onItemClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      }`}
    >
      <IconComponent className="h-4 w-4 shrink-0" />
      <span className="truncate">{name}</span>
    </Link>
  );
}
