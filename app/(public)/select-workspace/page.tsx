"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LayoutDashboard, Store, Users } from "lucide-react";

interface RolePayload {
  isAdminUser: boolean;
  isBusinessOwner: boolean;
  isStaffMember: boolean;
  businessSlug?: string;
  staffBusinessSlug?: string;
}

export default function SelectWorkspacePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<RolePayload>({
    isAdminUser: false,
    isBusinessOwner: false,
    isStaffMember: false,
  });

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/check-onboarding", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;

        // ✅ FIX: Extract parameters from data.metadata or custom parameters sent by your endpoint
        // Safely fallback if data payload properties are directly attached
        const actualBusinessSlug =
          data?.businessSlug || data?.slug || data?.metadata?.businessSlug;
        const actualStaffSlug =
          data?.staffBusinessSlug || data?.metadata?.staffBusinessSlug;

        setRoles({
          // ✅ FIX: Determine true admin access based on explicit backend role properties rather than hardcoding true
          isAdminUser:
            data?.isAdmin ||
            data?.role === "ADMIN" ||
            data?.destination === "/admin",
          isBusinessOwner: data?.isBusinessOwner || !!actualBusinessSlug,
          isStaffMember: data?.isStaffMember || !!actualStaffSlug,
          businessSlug: actualBusinessSlug || undefined,
          staffBusinessSlug: actualStaffSlug || undefined,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to parse grid identity mapping metrics:", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans antialiased">
        <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
      </div>
    );
  }

  const activeIdentities = [
    roles.isAdminUser,
    roles.isBusinessOwner,
    roles.isStaffMember,
  ].filter(Boolean);
  const identityCount = activeIdentities.length;

  let gridStyle = "grid-cols-1";
  if (identityCount === 2) gridStyle = "md:grid-cols-2 max-w-3xl";
  if (identityCount >= 3) gridStyle = "md:grid-cols-3 max-w-5xl";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 select-none">
      <div className="max-w-2xl w-full text-center mb-12 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
          Welcome back to FreshPoint
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Your account holds multiple operational identities across this
          environment. Select a verified workspace domain to launch your
          operational center.
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 w-full ${gridStyle} transition-all duration-300 mx-auto justify-center`}
      >
        {/* CARD A: PLATFORM ADMIN INTERCEPT */}
        {roles.isAdminUser && (
          <div className="group relative bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:border-indigo-500 hover:shadow-md flex flex-col justify-between h-full">
            <div>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold mb-4 shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                System Administration
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Access master telemetry, marketplace audit ledgers, vendor
                verification approval queues, and global parameters.
              </p>
            </div>
            <Link
              href="/admin"
              className="mt-6 w-full text-center inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-foreground text-background transition-colors hover:bg-foreground/90 cursor-pointer"
            >
              Launch Core Admin
            </Link>
          </div>
        )}

        {/* CARD B: STOREFRONT MERCHANT / OWNER PANEL */}
        {roles.isBusinessOwner && (
          <div className="group relative bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:border-orange-500 hover:shadow-md flex flex-col justify-between h-full">
            <div>
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold mb-4 shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                Storefront Business Panel
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Manage your physical store listings, track product catalogs,
                coordinate booking slots, and fulfill customer order ledgers.
              </p>
            </div>
            <Link
              href={
                roles.businessSlug
                  ? `/business/${roles.businessSlug}`
                  : "/business/dashboard"
              }
              className="mt-6 w-full text-center inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 text-white transition-colors hover:bg-orange-700 cursor-pointer"
            >
              Launch Storefront
            </Link>
          </div>
        )}

        {/* CARD C: STAFF WORKING PROFILE PANEL */}
        {roles.isStaffMember && (
          <div className="group relative bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:border-emerald-500 hover:shadow-md flex flex-col justify-between h-full">
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold mb-4 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                Staff Operations Hub
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Log into your assigned retail team environment, manage queue
                allocations, verify check-in vouchers, and log customer
                appointments.
              </p>
            </div>
            <Link
              href={
                roles.staffBusinessSlug
                  ? `/business/${roles.staffBusinessSlug}/staff`
                  : "/staff/dashboard"
              }
              className="mt-6 w-full text-center inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white transition-colors hover:bg-emerald-700 cursor-pointer"
            >
              Launch Staff Panel
            </Link>
          </div>
        )}
      </div>

      <div className="text-center border-t border-border pt-6 w-full max-w-md mt-10">
        <p className="text-xs text-muted-foreground">
          Just want to check out storefront products?{" "}
          <Link
            href="/"
            className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-all"
          >
            Browse Marketplace as Customer →
          </Link>
        </p>
      </div>
    </div>
  );
}
