import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  Sparkles,
  Building2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default async function WorkspaceSelectorPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }

  // 1. Resolve core authenticated email channel constants
  const clerkUser = await currentUser();
  const emailAddress =
    clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";

  if (!emailAddress) {
    redirect("/");
  }

  // 2. Query out both relational tenant pipelines in parallel
  const systemUser = await prisma.user.findUnique({
    where: { email: emailAddress },
    select: { id: true, firstName: true },
  });

  if (!systemUser) {
    redirect("/");
  }

  const [ownedBusiness, staffWorkspace] = await Promise.all([
    prisma.business.findFirst({
      where: { ownerId: systemUser.id },
      select: { name: true, slug: true, status: true },
    }),
    prisma.staffProfile.findFirst({
      where: {
        email: emailAddress,
        isActive: true,
      },
      include: {
        business: {
          select: { name: true },
        },
      },
    }),
  ]);

  // Safety net fallback: If they don't have dual identity vectors, push them to their single matching track
  if (!ownedBusiness && !staffWorkspace) redirect("/");
  if (ownedBusiness && !staffWorkspace)
    redirect(`/business/${ownedBusiness.slug}`);
  if (!ownedBusiness && staffWorkspace) redirect("/staff/dashboard");

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto w-full sm:max-w-xl text-center px-4">
        {/* Top FreshPoint Core Branding Node */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 mb-4 select-none">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            {"Freshpoint Workspace Router"}
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase sm:text-4xl">
          {"Select Your Portal"}
        </h1>
        <p className="mt-2 text-xs md:text-sm font-medium text-muted-foreground max-w-md mx-auto">
          {"Welcome back, "}{" "}
          <span className="text-foreground font-bold">
            {systemUser.firstName}
          </span>
          {
            ". Your profile is verified across multiple workspace boundaries. Choose an account to manage your operations."
          }
        </p>
      </div>

      <div className="mt-10 sm:mx-auto w-full sm:max-w-2xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* OPTION CARD A: MERCHANT STOREFRONT MANAGEMENT CONSOLE */}
          {ownedBusiness && (
            <Link
              href={`/business/${ownedBusiness.slug}`}
              className="relative group flex flex-col justify-between p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 text-left min-w-0"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform duration-200">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-foreground uppercase tracking-wider truncate">
                      {"Manager Panel"}
                    </h3>
                    {ownedBusiness.status?.toLowerCase() === "approved" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {"✓ Verified"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-1">
                    {
                      "Manage configurations, edit items catalogs, track revenue matrices, and manage staff rosters at:"
                    }
                  </p>
                  <p className="text-xs font-bold text-foreground mt-2 truncate bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/60">
                    {ownedBusiness.name}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary/80">
                <span>{"Launch Merchant Hub"}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          )}

          {/* OPTION CARD B: STAFF SHIFT WORKFORCE INTERFACE */}
          {staffWorkspace && (
            <Link
              href="/staff/dashboard"
              className="relative group flex flex-col justify-between p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 text-left min-w-0"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 group-hover:scale-105 transition-transform duration-200 dark:bg-amber-500/20 dark:text-amber-400">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-foreground uppercase tracking-wider truncate">
                      {"Staff Station"}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400">
                      {staffWorkspace.role || "Team Member"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-1">
                    {
                      "Review personal assigned appointments portfolios, track active retail packing queues, and monitor rotas at:"
                    }
                  </p>
                  <p className="text-xs font-bold text-foreground mt-2 truncate bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/60">
                    {staffWorkspace.business.name}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:opacity-80">
                <span>{"Clock Into Shift"}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          )}
        </div>

        {/* Global Security Policy Note Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground select-none">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span>
            {
              "FreshPoint Unified Multi-Tenant Security Gateway Protocols Active."
            }
          </span>
        </div>
      </div>
    </main>
  );
}
