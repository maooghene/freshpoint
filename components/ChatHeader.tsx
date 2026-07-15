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
        <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 border border-primary/20">
          <FreshpointLogo className="text-primary" size={18} />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card animate-pulse" />
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
