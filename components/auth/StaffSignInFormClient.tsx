"use client";
"use client";

import { useState, useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import {
  KeyRound,
  Sparkles,
  UserCheck,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function StaffSignInFormClient() {
  const { isSignedIn } = useAuth();
  const [viewState, setViewState] = useState<
    "gateway" | "clerk-login" | "clerk-register"
  >("gateway");
  const [syncing, setSyncing] = useState(false);

  const handleActivateStaffLink = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/auth/sync-staff-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Could not locate matching workspace records.",
        );

      toast.success("Profile roster connected successfully!");
      window.location.href = `/business/${data.businessSlug}/staff`;
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Account synchronization failed.",
      );
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      const taskTimer = setTimeout(() => {
        handleActivateStaffLink();
      }, 0);
      return () => clearTimeout(taskTimer);
    }
  }, [isSignedIn]);

  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-pulse">
        <Loader2 className="animate-spin text-primary size-10" />
        <div className="space-y-1">
          <p className="text-sm font-black text-foreground">
            Syncing Team Workspace...
          </p>
          <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
            Locking your security credentials directly into your shop identity
            roster card row.
          </p>
        </div>
      </div>
    );
  }

  // CHOICE GATEWAY UI
  if (viewState === "gateway") {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="p-4 bg-muted/60 border border-border/60 rounded-2xl flex gap-3 text-xs text-muted-foreground leading-relaxed font-medium">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <span>
            Please choose an option below to create your password credentials or
            link an existing profile to claim your workspace seat automatically.
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => setViewState("clerk-register")}
            className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <UserCheck size={14} /> Create Professional Profile
          </Button>

          <Button
            onClick={() => setViewState("clerk-login")}
            variant="outline"
            className="w-full h-12 rounded-xl font-bold text-xs border border-border bg-background/50 hover:bg-secondary/50 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <KeyRound size={14} /> Link Existing Account
          </Button>
        </div>
      </div>
    );
  }

  // 🛠️ CLERK PIPELINE OVERRIDES: Custom layout parameters pack fields to a centered maximum width (w-full max-w-[340px])
  const clerkThemeOverrides = {
    elements: {
      rootBox: "w-full flex justify-center",
      card: "shadow-none border-none bg-transparent p-0 w-full max-w-[340px] flex flex-col items-center",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      formContainer: "w-full space-y-4",
      formFieldInput:
        "h-11 rounded-xl bg-background border border-border focus:border-primary text-xs font-bold text-foreground w-full px-3.5",
      formButtonPrimary:
        "w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-sm cursor-pointer transition-all",
      footer: "hidden",
      identityPreviewText: "text-foreground font-bold text-xs",
      formFieldLabel:
        "text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center w-full animate-in zoom-in-95 duration-200 relative pt-4">
      {/* Sleek Floating Back Arrow Button */}
      <button
        onClick={() => setViewState("gateway")}
        className="absolute -top-4 left-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1 select-none"
      >
        <ArrowLeft size={12} /> Options
      </button>

      {/* Renders Clerk with your custom styles injected directly inside its visual hooks */}
      {viewState === "clerk-register" ? (
        <SignUp
          routing="hash"
          forceRedirectUrl="#"
          appearance={clerkThemeOverrides}
        />
      ) : (
        <SignIn
          routing="hash"
          forceRedirectUrl="#"
          appearance={clerkThemeOverrides}
        />
      )}

      {/* Manual Sync Fallback Activation Anchor Tag */}
      <button
        onClick={handleActivateStaffLink}
        className="mt-6 w-full max-w-[340px] text-[10px] font-black tracking-widest uppercase text-primary bg-primary/5 border border-primary/10 rounded-xl py-2.5 hover:bg-primary/10 transition-all cursor-pointer shadow-xs text-center select-none"
      >
        ⚡ Claim Roster Slot & Sync
      </button>
    </div>
  );
}

