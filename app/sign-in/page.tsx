// app/sign-in/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StaffSignInFormClient from "@/components/auth/StaffSignInFormClient";

export default async function StaffSignInPage() {
  const { userId: clerkId } = await auth();

  // AUTO-ROUTING GATEWAY: If they are already fully authenticated, sync states and skip the form
  if (clerkId) {
    const userProfile = await prisma.user.findUnique({
      where: { clerkId },
      include: { staffProfile: true },
    });

    if (userProfile?.staffProfile) {
      const business = await prisma.business.findUnique({
        where: { id: userProfile.staffProfile.businessId },
      });
      if (business) {
        redirect(`/business/${business.slug}/staff`);
      }
    }
    redirect("/");
  }

  return (
    // 🛠️ FIX: Added pt-16 and min-h calculation to guarantee the card never clips into your navigation bar
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-background/50 relative overflow-hidden">
      {/* High-End Ambient Background Lighting Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-primary/10 blur-[120px] -z-10 animate-pulse duration-4000" />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-indigo-500/5 blur-[100px] -z-10" />

      {/* 🛠️ FIX: Strict layout constraints (max-w-md) ensure the login panel stays clean, centered, and compact */}
      <div className="w-full max-w-md bg-card/70 backdrop-blur-xl border border-border/80 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header Text Section */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
            <Sparkles className="size-5 animate-spin duration-3000" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Team{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Onboarding
            </span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold max-w-[280px] mx-auto leading-relaxed">
            Accept your workplace invitation token and connect your profile
            roster.
          </p>
        </div>

        {/* Client Interactive Flow Authentication Widget */}
        <StaffSignInFormClient />
      </div>
    </div>
  );
}

// Simple absolute wrapper icon fallback helper component for server context compilation
function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://w3.org"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  );
}
