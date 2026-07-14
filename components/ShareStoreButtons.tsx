"use client";

import * as React from "react";
import { Share2, Check, MessageSquare, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareStoreButtonsProps {
  shopSlug: string;
  shopName: string;
  businessPhone: string;
}

export function ShareStoreButtons({
  shopSlug,
  shopName,
  businessPhone,
}: ShareStoreButtonsProps) {
  const [copied, setCopied] = React.useState(false);

  // Correction applied: Hard references shifted strictly away from legacy endpoints
  const getPublicBusinessUrl = () => {
    if (typeof window === "undefined")
      return `https://freshpoint.com{shopSlug}`;
    return `${window.location.origin}/business/${shopSlug}`;
  };

  const publicUrl = getPublicBusinessUrl();

  const formattedMsg = encodeURIComponent(
    `👋 Hello! Welcome to ${shopName} on FreshPoint. You can now view our items, check our services, and book slots directly online here: ${publicUrl}`,
  );

  const whatsappShareLink = `https://wa.me{formattedMsg}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy public business URL link:", err);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          Customer Shop Page Link
        </h3>
        <p className="text-xs text-muted-foreground">
          Your public shop link is{" "}
          <span className="font-mono text-primary bg-muted px-1.5 py-0.5 rounded text-[11px] font-medium">{`.../business/${shopSlug}`}</span>
          . Share it to receive bookings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button
          onClick={handleCopy}
          variant="secondary"
          className="rounded-xl h-9 text-xs font-semibold gap-1.5 flex-1 sm:flex-initial"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Copied Link!
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              Copy Store Link
            </>
          )}
        </Button>

        <Button
          asChild
          className="bg-[#25D366] text-white hover:bg-[#20ba56] hover:text-white border-none rounded-xl h-9 text-xs font-bold gap-1.5 flex-1 sm:flex-initial"
        >
          <a href={whatsappShareLink} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-3.5 w-3.5 fill-current" />
            Share to WhatsApp
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="rounded-xl h-9 text-xs font-semibold border-border bg-background hover:bg-muted p-2 w-9 sm:w-auto aspect-square sm:aspect-auto"
          title="View Live Page"
        >
          <a
            href={`/business/${shopSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-1 flex items-center justify-center"
          >
            <span className="hidden sm:inline">Preview</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </Button>
      </div>
    </div>
  );
}
