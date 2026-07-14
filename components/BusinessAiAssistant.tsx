"use client";

import * as React from "react";
import { X, Bot, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FreshpointLogo } from "./icons/FreshpointLogo";

interface ChatHistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface DisplayMessage {
  sender: "bot" | "user";
  text: string;
}

export function BusinessAiAssistant() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isTyping, setIsTyping] = React.useState<boolean>(false);
  const [inputVal, setInputVal] = React.useState<string>("");

  const [messages, setMessages] = React.useState<DisplayMessage[]>([
    {
      sender: "bot",
      text: "Hi — I can help you check recent orders, bookings, or open complaints for your business. What do you need?",
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userText = inputVal.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputVal("");
    setIsTyping(true);

    try {
      const formattedHistory: ChatHistoryMessage[] = messages.map(
        (m: DisplayMessage): ChatHistoryMessage => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }),
      );

      formattedHistory.push({ role: "user", content: userText });

      const response = await fetch("/api/businesses/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedHistory }),
      });

      if (!response.ok)
        throw new Error("Server communication link interrupted.");

      const data = (await response.json()) as { text: string };
      setMessages((prev) => [...prev, { sender: "bot", text: data.text }]);
    } catch (err) {
      console.error("Business assistant pipeline failure:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "We're experiencing a brief connection delay. Please check your network and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center p-0 transition-transform hover:scale-105"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="w-80 md:w-96 h-[450px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <FreshpointLogo
                className="text-amber-300 animate-pulse"
                size={16}
              />
              <div>
                <h4 className="text-xs font-black tracking-wide">
                  BUSINESS ASSISTANT
                </h4>
                <p className="text-[10px] text-primary-foreground/80 font-medium">
                  Operations Support
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/30 text-xs">
            {messages.map((msg: DisplayMessage, i: number) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                      : "bg-card border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start items-center gap-1.5 text-muted-foreground text-[10px] font-bold bg-card/80 border px-3 py-2 rounded-xl w-max">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Assistant is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-card border-t border-border flex gap-2"
          >
            <Input
              disabled={isTyping}
              value={inputVal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputVal(e.target.value)
              }
              placeholder="Ask about orders, bookings, complaints..."
              className="rounded-xl h-10 text-xs flex-1 border-input focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              disabled={isTyping || !inputVal.trim()}
              size="sm"
              className="h-10 w-10 rounded-xl p-0 shrink-0 font-bold"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
