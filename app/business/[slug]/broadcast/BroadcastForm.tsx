"use client";

import { toast } from "@/lib/toast";
import { FormEvent, useState } from "react";

export default function BroadcastForm({ businessId }: { businessId: string }) {
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/businesses/${businessId}/broadcast`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), message: form.get("message") }) });
    const data = await response.json().catch(() => ({}));
    const message = response.ok ? "Broadcast published." : data.error || "Could not publish broadcast.";
    setStatus(message);
    if (response.ok) toast.success(message);
    else toast.error(message);
    if (response.ok) (event.currentTarget as HTMLFormElement).reset();
  }
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6"><h1 className="text-xl font-bold">Promotional broadcast</h1><input name="title" required minLength={3} placeholder="Title" className="w-full rounded-xl border border-border bg-background px-3 py-2" /><textarea name="message" required minLength={5} placeholder="Message" rows={5} className="w-full rounded-xl border border-border bg-background px-3 py-2" /><button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Publish broadcast</button>{status && <p className="text-sm">{status}</p>}</form>;
}
