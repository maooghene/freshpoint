"use client";

import * as React from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInputForm } from "./ChatInputForm";
import { ChatToggleButton } from "./ChatToggleButton";

interface DisplayMessage {
  sender: "bot" | "user";
  text: string;
}

export function AiSupportWidget() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isTyping, setIsTyping] = React.useState<boolean>(false);
  const [expanded, setExpanded] = React.useState<boolean>(true);

  const [isHoverCapable, setIsHoverCapable] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  });

  const [messages, setMessages] = React.useState<DisplayMessage[]>([
    {
      sender: "bot",
      text: "Welcome to FreshPoint Support. How can I assist you with appointments, orders, or services today?",
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const collapseTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handler = (e: MediaQueryListEvent) => setIsHoverCapable(e.matches);
    hoverQuery.addEventListener("change", handler);
    return () => hoverQuery.removeEventListener("change", handler);
  }, []);

  React.useEffect(() => {
    if (!isHoverCapable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    collapseTimerRef.current = setTimeout(() => setExpanded(false), 3200);
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [isHoverCapable]);

  const handleSendMessage = async (userText: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));
      history.push({ role: "user", content: userText });

      const response = await fetch("/api/support/chat", {
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
          text: "Connection delay encountered. Please try again shortly.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 font-sans select-none antialiased"
      role="region"
      aria-label="FreshPoint AI Support"
    >
      {!isOpen ? (
        <ChatToggleButton
          showLabel={expanded || !isHoverCapable}
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
        /* Opaque Global Token Container — Perfectly Adapts to Light/Dark Mode Variables */
        <div className="w-[calc(100vw-32px)] sm:w-[360px] md:w-[400px] h-[75vh] max-h-[500px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          <ChatHeader onClose={() => setIsOpen(false)} />
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            bottomRef={messagesEndRef}
          />
          <ChatInputForm isTyping={isTyping} onSubmit={handleSendMessage} />
        </div>
      )}
    </div>
  );
}
