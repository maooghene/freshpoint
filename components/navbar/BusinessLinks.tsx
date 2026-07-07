"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, Store, Users, Menu, X } from "lucide-react";

interface BusinessLinksProps {
  businessId: string;
  pathSegments: string[];
}

export function BusinessLinks({
  businessId,
  pathSegments,
}: BusinessLinksProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  return (
    <div className="relative flex items-center md:flex-1 md:justify-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
        <Link
          href={`/business/${businessId}`}
          className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${pathSegments.length === 2 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutDashboard size={16} /> Overview
        </Link>
        <Link
          href={`/business/${businessId}/manage-items`}
          className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${pathSegments.includes("add-service") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Store size={16} /> Services & Products
        </Link>
        <Link
          href={`/business/${businessId}/staff`}
          className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${pathSegments.includes("staff") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Users size={16} /> Staff
        </Link>
      </div>

      {isOpen && (
        <div className="absolute top-12 left-0 w-56 bg-card border border-border rounded-xl p-3 shadow-xl flex flex-col gap-2 z-50 animate-fadeIn">
          <Link
            href={`/business/${businessId}`}
            onClick={() => setIsOpen(false)}
            className={`text-sm font-medium flex items-center gap-2 p-2.5 rounded-lg transition-colors ${pathSegments.length === 2 ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"}`}
          >
            <LayoutDashboard size={16} /> Overview
          </Link>
          <Link
            href={`/business/${businessId}/manage-items`}
            onClick={() => setIsOpen(false)}
            className={`text-sm font-medium flex items-center gap-2 p-2.5 rounded-lg transition-colors ${pathSegments.includes("add-service") ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"}`}
          >
            <Store size={16} /> Services & Products
          </Link>
          <Link
            href={`/business/${businessId}/staff`}
            onClick={() => setIsOpen(false)}
            className={`text-sm font-medium flex items-center gap-2 p-2.5 rounded-lg transition-colors ${pathSegments.includes("staff") ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"}`}
          >
            <Users size={16} /> Staff
          </Link>
        </div>
      )}
    </div>
  );
}
