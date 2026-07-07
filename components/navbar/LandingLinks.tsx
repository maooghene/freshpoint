"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

export function LandingLinks() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
        <a href="#for-owners" className="hover:text-foreground transition-colors">For Providers</a>
      </div>

      {isOpen && (
        <div className="absolute top-12 right-0 w-48 bg-card border border-border rounded-xl p-4 shadow-xl flex flex-col gap-3 text-sm font-medium text-muted-foreground z-50 animate-fadeIn">
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="hover:text-foreground p-2 rounded-lg hover:bg-muted/50">How it Works</a>
          <a href="#for-owners" onClick={() => setIsOpen(false)} className="hover:text-foreground p-2 rounded-lg hover:bg-muted/50">For Providers</a>
        </div>
      )}
    </div>
  );
}
