"use client";

import React, { useState, useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Building2,
  UserPlus,
  LogIn,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";

export default function StaffSignInFormClient(): React.JSX.Element {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [viewState, setViewState] = useState<
    "gateway" | "clerk-login" | "clerk-register"
  >("gateway");
  const [syncing, setSyncing] = useState<boolean>(false);

  const handleActivateStaffLink = async (): Promise<void> => {
    try {
      const res = await fetch("/api/auth/sync-staff-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        throw new Error(
          data.error || "Could not locate matching workspace records.",
        );
      }

      toast.success("Profile roster connected successfully!");
      router.push("/staff/dashboard");
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Account synchronization failed.";
      toast.error(errorMessage);
      setSyncing(false);
    }
  };

  /* 
    🎯 THE CASCADING RENDERING FIX:
    Wrapped inside an explicit asynchronous handler loop execution stack 
    to decouple the state mutation from the immediate mounting pass framework.
  */
  useEffect(() => {
    if (isLoaded && isSignedIn && !syncing) {
      const scheduleSynchronization = async (): Promise<void> => {
        setSyncing(true);
        await handleActivateStaffLink();
      };

      void scheduleSynchronization();
    }
  }, [isSignedIn, isLoaded, syncing]);

  const clerkAppearance = {
    elements: {
      card: "shadow-none border-0 bg-transparent w-full mx-auto text-foreground",
      header: "hidden",
      formFieldLabel: "text-foreground font-bold text-xs mb-1.5",
      formFieldInput:
        "h-11 w-full rounded-xl text-sm border border-border bg-background text-foreground focus:ring-2 focus:ring-ring transition-all",
      socialButtonsBlockButton:
        "border border-border bg-background hover:bg-muted text-foreground rounded-xl h-11",
      socialButtonsBlockButtonText: "text-foreground font-semibold text-xs",
      formButtonPrimary:
        "w-full h-11 flex items-center justify-center bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md",
      footerActionText: "text-muted-foreground text-xs font-medium",
      footerActionLink: "text-primary hover:underline font-bold text-xs",
    },
  };

  if (!isLoaded || syncing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-sm mx-auto bg-muted/30 border border-border rounded-2xl px-6 animate-in fade-in duration-200">
        <Loader2 className="animate-spin text-primary h-7 w-7" />
        <div className="space-y-1">
          <p className="text-sm font-black text-foreground">
            Syncing Team Workspace
          </p>
          <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
            {
              "Locking your security credentials directly into your shop identity roster profile."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto animate-in zoom-in-98 duration-200">
      {viewState === "gateway" && (
        <div className="flex items-center justify-center gap-2 mb-6 select-none">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-black tracking-tight text-primary">
            Freshpoint Staff Portal
          </span>
        </div>
      )}

      {viewState === "gateway" ? (
        <div className="w-full space-y-5 transition-all duration-200">
          <div className="flex items-start gap-2.5 p-3.5 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground leading-relaxed">
            <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              {
                "Please log in using the exact email address where you received your Freshpoint invitation token."
              }
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={() => setViewState("clerk-register")}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs shadow-md cursor-pointer"
            >
              <UserPlus size={14} />
              Create Professional Profile
            </button>

            <button
              type="button"
              onClick={() => setViewState("clerk-login")}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-xs border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <LogIn size={14} />
              Link Existing Account
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4 relative pt-4">
          <button
            type="button"
            onClick={() => setViewState("gateway")}
            className="absolute -top-3 left-0 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1 select-none z-10"
          >
            <ArrowLeft size={12} /> Alternative Options
          </button>

          <div className="w-full flex justify-center overflow-hidden bg-transparent pt-4">
            {viewState === "clerk-register" ? (
              <SignUp
                routing="hash"
                forceRedirectUrl="#"
                appearance={clerkAppearance}
              />
            ) : (
              <SignIn
                routing="hash"
                forceRedirectUrl="#"
                appearance={clerkAppearance}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
