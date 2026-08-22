"use client";

import { Loader2 } from "lucide-react";

interface DisplayMessage {
  sender: "bot" | "user";
  text: string;
}

interface ChatMessagesProps {
  messages: DisplayMessage[];
  isTyping: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  isTyping,
  bottomRef,
}: ChatMessagesProps) {
  return (
    <div
      className="flex-1 p-4 overflow-y-auto space-y-4 bg-background overscroll-contain [webkit-overflow-scrolling:touch]"
      role="log"
      aria-live="polite"
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed border ${
              msg.sender === "user"
                ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none font-medium shadow-md shadow-primary/5"
                : "bg-card border-border text-card-foreground rounded-tl-none"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start items-center gap-2 text-muted-foreground text-[11px] font-medium bg-card border border-border px-3 py-2 rounded-xl w-max">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Processing...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
