"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportIcon } from "./icons/SupportIcon";

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="bg-card border-b border-border pl-3 pr-1.5 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SupportIcon className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
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
        className="h-10 w-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
