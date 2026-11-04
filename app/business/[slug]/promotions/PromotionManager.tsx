"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface ActivePromotion {
  id: string;
  title: string;
  details: string | null;
  endsAt: string;
}

const DURATIONS: { label: string; hours: number }[] = [
  { label: "6 hours", hours: 6 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "14 days", hours: 336 },
  { label: "30 days", hours: 720 },
];

export default function PromotionManager({
  businessId,
  active,
}: {
  businessId: string;
  active: ActivePromotion | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const hours = Number(form.get("hours"));
    try {
      const response = await fetch(`/api/businesses/${businessId}/promotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          details: form.get("details"),
          endsAt: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(data.error || "Could not start the promotion.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    if (!window.confirm("End this promotion now? Customers will stop seeing it.")) return;
    setBusy(true);
    try {
      await fetch(`/api/businesses/${businessId}/promotion`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-xl font-bold">Promotion running</h1>
        <div>
          <p className="font-semibold">{active.title}</p>
          {active.details && (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
              {active.details}
            </p>
          )}
          <p className="mt-3 text-sm">
            Ends {new Date(active.endsAt).toLocaleString()}. Customers see a
            countdown on your storefront and cannot dismiss it.
          </p>
        </div>
        <button
          onClick={end}
          disabled={busy}
          className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-muted disabled:opacity-60"
        >
          End promotion now
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={start} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h1 className="text-xl font-bold">Start a promotion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shows a banner with a live countdown at the top of your storefront
          until the offer ends. One promotion can run at a time.
        </p>
      </div>
      <input
        name="title"
        required
        minLength={3}
        maxLength={80}
        placeholder="e.g. 20% off all haircuts"
        className="w-full rounded-xl border border-border bg-background px-3 py-2"
      />
      <textarea
        name="details"
        maxLength={300}
        rows={3}
        placeholder="Details (optional): who it applies to, how to claim it"
        className="w-full rounded-xl border border-border bg-background px-3 py-2"
      />
      <label className="block text-sm font-medium">
        How long should it run?
        <select
          name="hours"
          defaultValue={72}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
        >
          {DURATIONS.map((d) => (
            <option key={d.hours} value={d.hours}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={busy}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        Start promotion
      </button>
      {status && <p className="text-sm text-destructive">{status}</p>}
    </form>
  );
}
