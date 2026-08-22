// components/business/ContactActionBar.tsx
"use client";

import { PhoneIcon, MessageCircleIcon } from "lucide-react";

interface ContactActionBarProps {
  phone: string | null | undefined;
  label: string;
}

export function ContactActionBar({ phone, label }: ContactActionBarProps) {
  if (!phone) {
    return (
      <div className="p-3.5 rounded-xl border border-dashed border-border bg-muted/10 text-center">
        <p className="text-xs italic text-muted-foreground font-medium">
          No emergency contact recorded for {label}
        </p>
      </div>
    );
  }

  const cleanPhone = phone.trim();

  // Strip non-numeric formatting characters for deep linking
  const numericOnly = cleanPhone.replace(/\D/g, "");

  // If a number starts with a local zero format (e.g. 080...), map it to Nigeria's standard country code +234
let whatsappUrl = `https://wa.me/${numericOnly}`;
if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
  whatsappUrl = `https://wa.me/${numericOnly.slice(1)}`;
}

  return (
    <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-muted-foreground">{label} Contact</span>
        <span className="text-foreground tracking-wider font-mono bg-muted px-2 py-0.5 rounded-md">
          {cleanPhone}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {/* Phone Link */}
        <a
          href={`tel:${cleanPhone}`}
          className="h-10 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <PhoneIcon className="size-3.5 text-primary" />
          Direct Call
        </a>

        {/* WhatsApp URL */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <MessageCircleIcon className="size-3.5 fill-white text-transparent" />
          WhatsApp Chat
        </a>
      </div>
    </div>
  );
}
