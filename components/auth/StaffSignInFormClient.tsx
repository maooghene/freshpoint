"use client";

import React, { useState, useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import {
  Loader2,
  ArrowLeft,
  Building2,
  UserPlus,
  LogIn,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";


interface SyncResponseSuccess {
  businessSlug: string;
}

interface SyncResponseError {
  error: string;
}

export default function StaffSignInFormClient() {
  const { isSignedIn } = useAuth();
  const [viewState, setViewState] = useState<
    "gateway" | "clerk-login" | "clerk-register"
  >("gateway");
  const [syncing, setSyncing] = useState<boolean>(false);

  const handleActivateStaffLink = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/auth/sync-staff-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json()) as SyncResponseSuccess &
        SyncResponseError;

      if (!res.ok) {
        throw new Error(
          data.error || "Could not locate matching workspace records.",
        );
      }

      toast.success("Profile roster connected successfully!");
      window.location.href = `/business/${data.businessSlug}/staff`;
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

  useEffect(() => {
    if (!isSignedIn) return;

    const taskTimer = setTimeout(() => {
      void handleActivateStaffLink();
    }, 0);

    return () => clearTimeout(taskTimer);
  }, [isSignedIn]);

  // Pass custom Tailwind layer utility names to Clerk elements to sync text perfectly
  const clerkAppearance = {
    elements: {
      // Containers & Blocks
      card: "shadow-none border-0 bg-transparent w-full mx-auto text-foreground",
      header: "space-y-1 text-center",

      // Core Form Titles & Descriptions
      headerTitle:
        "text-foreground-strong font-bold tracking-tight text-xl dark:text-[var(--foreground)]",
      headerSubtitle:
        "text-muted-foreground text-xs dark:text-[var(--muted-foreground)]",

      // Labels and Inputs
      formFieldLabel:
        "text-foreground-strong font-medium text-xs mb-1.5 dark:text-[var(--foreground)]",
      formFieldInput:
        "h-10 w-full rounded-xl text-sm border border-border bg-card text-foreground focus:ring-2 focus:ring-ring transition-all dark:bg-[var(--secondary)] dark:border-[var(--border)] dark:text-[var(--foreground)]",
      formFieldInputShowPasswordButton:
        "text-muted-foreground hover:text-foreground-strong dark:text-[var(--muted-foreground)]",

      // Action Elements & Social Buttons
      socialButtonsBlockButton:
        "border border-border bg-background hover:bg-surface-warm-muted transition-colors text-foreground dark:bg-[var(--secondary)] dark:text-[var(--foreground)]",
      socialButtonsBlockButtonText:
        "text-foreground font-medium text-xs dark:text-[var(--foreground)]",
      formButtonPrimary:
        "w-full h-11 flex items-center justify-center bg-primary text-primary-foreground font-semibold text-xs transition-colors rounded-xl dark:bg-[var(--primary)] dark:text-[var(--primary-foreground)]",

      // Links & Footers
      footerActionText:
        "text-muted-foreground text-xs dark:text-[var(--muted-foreground)]",
      footerActionLink:
        "text-primary hover:text-brand-solid transition-colors font-semibold dark:text-[var(--primary)]",
      identityPreviewText:
        "text-foreground font-medium dark:text-[var(--foreground)]",
      identityPreviewEditButtonIcon: "text-primary dark:text-[var(--primary)]",
    },
  };

  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center mt-28 py-16 text-center space-y-4 max-w-md mx-auto bg-surface-warm-muted dark:bg-secondary border border-surface-warm-border dark:border-border rounded-2xl shadow-sm px-6 transition-colors duration-200">
        <Loader2 className="animate-spin text-primary h-8 w-8 dark:text-ring" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground-strong">
            Syncing Team Workspace
          </p>
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
            Locking your security credentials directly into your shop identity
            roster profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto animate-in zoom-in-95 duration-200 mt-28 pt-4 pb-12 px-6">
      {/* BRANDING HEADER CONTAINER */}
      <div className="flex items-center gap-2 mb-8 select-none">
        <div className="p-2 rounded-lg bg-surface-warm border border-surface-warm-border dark:bg-secondary dark:border-border transition-colors">
          <Building2 className="h-5 w-5 text-primary dark:text-ring" />
        </div>
        <span className="text-lg font-bold tracking-tight text-primary">
          Freshpoint Staff Portal
        </span>
      </div>

      {/* ACCESS CONSOLE GATEWAY */}
      {viewState === "gateway" ? (
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 transition-colors duration-200">
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-bold tracking-tight text-primary">
              Workspace Invitation
            </h2>
            <p className="text-xs text-muted-foreground">
              Claim your corporate profile row or link your pre-existing
              provider access account.
            </p>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-surface-warm-muted dark:bg-secondary border border-surface-warm-border dark:border-border rounded-xl text-xs text-muted-foreground leading-relaxed transition-colors">
            <ShieldAlert className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>
              Please log in using the exact email address where you received
              your Freshpoint invitation token.
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={() => setViewState("clerk-register")}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold bg-primary text-primary-foreground dark:bg-ring dark:text-background hover:bg-brand-solid dark:hover:bg-primary transition-colors text-xs shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <UserPlus size={14} />
              Create Professional Profile
            </button>

            <button
              type="button"
              onClick={() => setViewState("clerk-login")}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-xs border border-border bg-card text-foreground hover:bg-surface-warm-muted dark:hover:bg-secondary cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <LogIn size={14} />
              Link Existing Account
            </button>
          </div>
        </div>
      ) : (
        /* ADAPTIVE CLERK RENDER BLOCK */
        <div className="w-full flex flex-col items-center space-y-4 relative">
          <button
            type="button"
            onClick={() => setViewState("gateway")}
            className="absolute -top-7 left-0 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1 select-none z-10"
          >
            <ArrowLeft size={13} /> Alternative Options
          </button>

          <div className="w-full flex justify-center shadow-sm rounded-2xl border border-border overflow-hidden bg-card p-4 transition-colors duration-200">
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
