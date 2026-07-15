"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessAssistantToggleProps {
  showLabel: boolean;
  onOpen: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function BusinessAssistantToggle({
  showLabel,
  onOpen,
  onMouseEnter,
  onMouseLeave,
}: BusinessAssistantToggleProps) {
  return (
    <Button
      onClick={onOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label="Open Business Assistant"
      className="group relative flex items-center h-14 rounded-full overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl pl-[6px] transition-all duration-500 ease-out active:scale-95"
      style={{ paddingRight: showLabel ? "1.25rem" : "6px" }}
    >
      <span className="h-11 w-11 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0 border border-primary-foreground/5 shadow-inner group-hover:rotate-12 transition-transform duration-300">
        <Bot className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
      </span>
      <span
        className="grid transition-[grid-template-columns] duration-500 ease-out"
        style={{ gridTemplateColumns: showLabel ? "1fr" : "0fr" }}
      >
        <span className="overflow-hidden whitespace-nowrap">
          <span className="text-sm font-bold tracking-wide pl-3 text-primary-foreground">
            Business Assistant
          </span>
        </span>
      </span>
    </Button>
  );
}
