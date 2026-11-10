"use client";

import { SupportIcon } from "@/components/icons/SupportIcon";

interface ChatToggleButtonProps {
  /** Show the "Ask FreshPoint" label (desktop hover only; phones get the icon alone). */
  showLabel: boolean;
  onOpen: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Small round launcher. It never opens the chat by itself: the panel opens
 * only when the customer taps it.
 */
export function ChatToggleButton({
  showLabel,
  onOpen,
  onMouseEnter,
  onMouseLeave,
}: ChatToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label="Open FreshPoint support chat"
      className="group relative flex h-12 items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 ring-1 ring-black/5 transition-all duration-300 ease-out active:scale-90 sm:h-14 cursor-pointer"
      style={{ paddingRight: showLabel ? "1.1rem" : 0 }}
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
        <SupportIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
      </span>
      <span
        className="grid transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: showLabel ? "1fr" : "0fr" }}
      >
        <span className="overflow-hidden whitespace-nowrap">
          <span className="inline-flex items-center pl-0.5 text-sm font-bold tracking-wide">
            Ask FreshPoint
          </span>
        </span>
      </span>
    </button>
  );
}
