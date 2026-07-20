"use client";

import * as React from "react";
import { BusinessAssistantHeader } from "./BusinessAssistantHeader";
import { BusinessAssistantMessages } from "./BusinessAssistantMessages";
import { BusinessAssistantInput } from "./BusinessAssistantInput";
import { BusinessAssistantToggle } from "./BusinessAssistantToggle";

interface ChatHistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
interface DisplayMessage {
  sender: "bot" | "user";
  text: string;
}

export function BusinessAiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);
  const [messages, setMessages] = React.useState<DisplayMessage[]>([
    {
      sender: "bot",
      text: "Hi — I can help you check recent orders, bookings, or open complaints. What do you need?",
    },
  ]);

  const [isHoverCapable, setIsHoverCapable] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const collapseTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handler = (e: MediaQueryListEvent) => setIsHoverCapable(e.matches);
    hoverQuery.addEventListener("change", handler);
    return () => hoverQuery.removeEventListener("change", handler);
  }, []);

  // Only auto-expand the label on hover-capable (desktop/tablet) devices.
  // On touch/mobile we never want the expanded label taking up space.
  React.useEffect(() => {
    if (
      !isHoverCapable ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    collapseTimerRef.current = setTimeout(() => setExpanded(false), 3200);
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [isHoverCapable]);

  const handleSendMessage = async (userText: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsTyping(true);
    try {
      const history: ChatHistoryMessage[] = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));
      history.push({ role: "user", content: userText });

      const response = await fetch("/api/businesses/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Connection delay encountered. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Never show the expanding text label on mobile — icon only, always.
  const showLabel = isHoverCapable && expanded;

  return (
    <div
      className={
        // Icon-only footprint on mobile (small fixed corner button).
        // Full-size positioning restored from sm breakpoint up.
        "fixed bottom-4 right-4 z-40 font-sans select-none antialiased " +
        (isOpen ? "" : "scale-90 sm:scale-100 origin-bottom-right")
      }
    >
      {!isOpen ? (
        <BusinessAssistantToggle
          showLabel={showLabel}
          onOpen={() => setIsOpen(true)}
          onMouseEnter={() => {
            if (collapseTimerRef.current)
              clearTimeout(collapseTimerRef.current);
            setExpanded(true);
          }}
          onMouseLeave={() => {
            if (isHoverCapable) setExpanded(false);
          }}
        />
      ) : (
        <div className="w-[calc(100vw-32px)] sm:w-[360px] md:w-[400px] h-[70vh] sm:h-[75vh] max-h-[440px] sm:max-h-[500px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          <BusinessAssistantHeader onClose={() => setIsOpen(false)} />
          <BusinessAssistantMessages
            messages={messages}
            isTyping={isTyping}
            bottomRef={messagesEndRef}
          />
          <BusinessAssistantInput
            isTyping={isTyping}
            onSubmit={handleSendMessage}
          />
        </div>
      )}
    </div>
  );
}
