"use client";

import * as React from "react";
import {
  Store,
  Link2,
  Share2,
  Check,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { RegisterState } from "./actions";

interface Props {
  isPending: boolean;
  state: RegisterState;
  slugValue: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BasicInfoFields({
  isPending,
  state,
  slugValue,
  onNameChange,
  onSlugChange,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  const isSuccess = state?.success === true;
  const activeSlug = state?.finalizedSlug || slugValue;

  // Data Flow Anchor: Calibrated strictly to your active app/(public)/explore/[slug] route
  const getPublicExploreUrl = () => {
    if (typeof window === "undefined") {
      return `https://freshpoint.com{activeSlug}`;
    }
    return `${window.location.origin}/explore/${activeSlug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPublicExploreUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard API failure:", err);
    }
  };

  // 1. SUCCESS STATE VIEW
  if (isSuccess) {
    const publicUrl = getPublicExploreUrl();
    const messageText = `👋 Welcome to our new page on FreshPoint! You can view our available services, check our items, and book appointments directly online here: ${publicUrl}`;
    const whatsappLink = `https://wa.me{encodeURIComponent(messageText)}`;

    return (
      <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center space-y-2 py-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <Check className="h-6 w-6" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Your Business is Registered!
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your public customer link is ready. Share it on WhatsApp to start
            receiving bookings.
          </p>
        </div>

        <div className="space-y-2 bg-muted/50 p-4 rounded-2xl border border-border">
          <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Your Shareable Public Link
          </Label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 items-center flex min-w-0">
              <Input
                readOnly
                value={publicUrl}
                className="bg-background pr-10 font-mono text-xs rounded-xl border-border select-all h-10 truncate"
              />
            </div>
            <Button
              type="button"
              variant={copied ? "default" : "secondary"}
              onClick={handleCopyLink}
              className="rounded-xl transition-all font-semibold shrink-0 text-xs px-4 h-10 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            asChild
            type="button"
            className="bg-[#25D366] text-white hover:bg-[#20ba56] hover:text-white border-none rounded-xl gap-2 font-bold text-sm h-11"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="h-4 w-4 fill-current" />
              Share to WhatsApp
            </a>
          </Button>

          <Button
            asChild
            type="button"
            variant="outline"
            className="rounded-xl gap-2 font-bold text-sm h-11 border-border bg-background hover:bg-muted"
          >
            <a href={`/business/${activeSlug}`}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // 2. INPUT DATA ENTRY FORM STATE
  return (
    <>
      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-foreground font-bold"
        >
          <Store className="h-4 w-4 text-muted-foreground" />
          {"Business Name"}
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Freshpoint Salon & Spa"
          onChange={onNameChange}
          disabled={isPending}
          required
          className="rounded-xl"
        />
        {state.errors?.name && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="slug"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <Link2 className="h-4 w-4 text-muted-foreground" />
            {"Unique Link Link"}
          </Label>
          <span className="text-[11px] text-muted-foreground leading-normal">
            The clean marketplace link customers open to browse items and place
            bookings.
          </span>
        </div>
        <div className="relative flex items-center mt-1">
          {/* Restored clean prefix string anchor matching the true route structure */}
          <span className="absolute left-3 text-xs font-medium text-muted-foreground select-none pointer-events-none">
            {"://freshpoint.com"}
          </span>
          <Input
            id="slug"
            name="slug"
            type="text"
            value={slugValue}
            onChange={onSlugChange}
            placeholder="salon-and-spa"
            disabled={isPending}
            required
            // Expanded left padding to pl-[152px] to accommodate the text layout prefix beautifully
            className="pl-[152px] rounded-xl font-mono text-xs h-10"
          />
        </div>
        {state.errors?.slug && (
          <p className="text-xs font-semibold text-destructive mt-0.5">
            {state.errors.slug}
          </p>
        )}
      </div>
    </>
  );
}
