import * as React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StaffSignInFormClient from "@/components/auth/StaffSignInFormClient";
import { Sparkles } from "lucide-react";

export default async function StaffSignInPage(): Promise<React.JSX.Element> {
  const { userId: clerkId } = await auth();

  // 🎯 AUTOMATED SECURITY CHECKPOINT
  if (clerkId) {
    const userProfile = await prisma.user.findUnique({
      where: { clerkId },
      include: { staffProfile: true },
    });

    if (userProfile?.staffProfile) {
      redirect("/staff/dashboard");
    }
    redirect("/");
  }

  return (
    /* 
      🛠️ THE NAVBOX BARRIER PROTECTOR:
      Using an exact top padding spacer layout ("pt-28 md:pt-32") to guarantee the card 
      always flows safely clear of your fixed navbar, while centering beautifully.
    */
    <div className="w-full min-h-screen bg-background flex flex-col justify-start items-center px-4 sm:px-6 pt-28 md:pt-32 pb-16 relative overflow-hidden antialiased select-none">
      {/* High-End Soft Ambient Backdrop Glow Meshes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse duration-4000" />
      <div className="absolute bottom-12 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

      {/* ── PREMIUM INTERACTIVE AUTH TERMINAL CARD ── */}
      <div className="w-full max-w-md bg-card/70 backdrop-blur-xl border border-border/80 shadow-2xl rounded-[2.5rem] p-6 sm:p-10 transition-all duration-300">
        {/* Header Icon & Branding Text Strings */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
            <Sparkles className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {"Staff Terminal"}
          </h1>
          <p className="text-xs text-muted-foreground font-semibold max-w-[280px] mx-auto leading-relaxed">
            {
              "Accept your workplace invitation token to configure your personal schedule."
            }
          </p>
        </div>

        {/* Client Interactive Flow Authentication Widget Component */}
        <StaffSignInFormClient />
      </div>
    </div>
  );
}
