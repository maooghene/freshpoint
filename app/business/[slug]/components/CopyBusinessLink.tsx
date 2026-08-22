"use client";

import * as React from "react";
import { Link2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyBusinessLinkProps {
  slug: string;
}

export function CopyBusinessLink({ slug }: CopyBusinessLinkProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      // Data Flow Anchor: Constructs the explicit public path pointing to your (public)/explore route group layer
      const publicUrl = `${window.location.origin}/explore/${slug}`;
      await navigator.clipboard.writeText(publicUrl);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link to clipboard:", err);
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Link2 className="h-4 w-4 text-primary" />
          Share Your Business Profile
        </h3>
        <p className="text-xs text-muted-foreground">
          Copy this public link to share on WhatsApp or social media so
          customers can browse your items and book.
        </p>
      </div>

      <Button
        onClick={handleCopy}
        variant={copied ? "default" : "secondary"}
        className="rounded-xl h-10 font-bold text-xs gap-2 transition-all shrink-0 sm:w-auto w-full"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            Copied Link!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-muted-foreground" />
            Copy Public Link
          </>
        )}
      </Button>
    </div>
  );
}
