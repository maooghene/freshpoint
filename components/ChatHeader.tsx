"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FreshpointLogo } from "./icons/FreshpointLogo";

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* 🌟 FIXED: Removed overflow-hidden from this wrapper to let the badge ring expand outward freely */}
        <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-card border border-border">
          {/* Explicitly isolate your internal branding graphic with custom bounding styles if clipping is needed */}
          <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
            <FreshpointLogo variant="mark" size={44} />
          </div>

          {/* 🌟 HIGH VISIBILITY STATUS BADGE: Shifted color to vibrant Emerald with a responsive scaling pulse aura */}
          <span className="absolute bottom-[-2px] right-[-2px] flex h-3 w-3">
            {/* Expanding ping aura for amplified peripheral layout visibility */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ring-2 ring-card" />
            {/* Bounded core center nodule */}
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-card" />
          </span>
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-wide text-foreground">
            FreshPoint AI
          </h4>
          <p className="text-[11px] text-muted-foreground font-medium">
            Support Online
          </p>
        </div>
      </div>

      <Button
        onClick={onClose}
        variant="ghost"
        aria-label="Close Chat"
        className="h-11 w-11 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
