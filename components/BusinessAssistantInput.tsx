"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BusinessAssistantInputProps {
  isTyping: boolean;
  onSubmit: (text: string) => void;
}

export function BusinessAssistantInput({
  isTyping,
  onSubmit,
}: BusinessAssistantInputProps) {
  const [inputVal, setInputVal] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;
    onSubmit(inputVal.trim());
    setInputVal("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-card border-t border-border flex gap-2 items-center shrink-0"
    >
      <div className="relative flex-1">
        <Input
          disabled={isTyping}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask about orders, bookings, complaints..."
          className="w-full rounded-xl h-11 text-sm bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
        />
      </div>
      <Button
        type="submit"
        disabled={isTyping || !inputVal.trim()}
        size="sm"
        aria-label="Send message"
        className="h-11 w-11 rounded-xl p-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground shadow-md transition-all active:scale-90"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
