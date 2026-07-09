import * as React from "react";
import { BookingStatus, OrderStatus } from "@prisma/client";

// =========================================================================
// 🔀 REGULAR VIEW LAYOUT & SIDEBAR NAVIGATION INTERFACES
// =========================================================================

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

export interface PageProps {
  params: Promise<{ slug: string }>;
}

// =========================================================================
// 📈 MODULAR HIGH-DENSITY DASHBOARD TELEMETRY SUBSETS
// =========================================================================

export interface DashboardStaffSubset {
  id: string;
}

export interface DashboardItemSubset {
  id: string;
  type: string;
}

export interface DashboardBookingSubset {
  id: string;
  status: BookingStatus;
  totalAmount: number | null;
  createdAt: Date;
}

export interface DashboardOrderSubset {
  id: string;
  status: OrderStatus;
  totalAmount: number | null;
  createdAt: Date;
}

export interface FullDashboardBusinessData {
  id: string;
  ownerId: string;
  staff: DashboardStaffSubset[];
  items: DashboardItemSubset[];
  bookings: DashboardBookingSubset[];
  orders: DashboardOrderSubset[];
}

export interface UserIdentityMetadata {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface RichBookingTimelineRecord {
  id: string;
  status: BookingStatus;
  totalAmount: number | null;
  createdAt: Date;
  user: UserIdentityMetadata | null;
}

export interface RichOrderTimelineRecord {
  id: string;
  status: OrderStatus;
  totalAmount: number | null;
  createdAt: Date;
  user: UserIdentityMetadata | null;
}
