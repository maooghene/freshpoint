"use client";

import * as React from "react";
import axios from "axios";
import { Loader2, Tag } from "lucide-react";
import { toast } from "@/lib/toast";
import { isSaleActive } from "@/lib/pricing";
import type { BaseItem } from "./types";

export type SaleFieldsPatch = Pick<
  BaseItem,
  "salePrice" | "saleStartsAt" | "saleEndsAt"
>;

const PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
];

/** datetime-local wants "YYYY-MM-DDTHH:mm" in the viewer's local time. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SaleSection({
  item,
  businessSlug,
  onChange,
}: {
  item: BaseItem;
  businessSlug: string;
  onChange: (itemId: string, sale: SaleFieldsPatch) => void;
}) {
  const active = isSaleActive(item);
  const [salePrice, setSalePrice] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const regular = item.price;
  const typed = Number(salePrice);
  const percentOff =
    salePrice !== "" && typed > 0 && typed < regular
      ? Math.round(((regular - typed) / regular) * 100)
      : null;

  const url = `/api/businesses/${businessSlug}/items/${item.id}/sale`;

  async function startSale() {
    if (!(typed > 0 && typed < regular)) {
      toast.error("The sale price must be lower than the regular price.");
      return;
    }
    if (!endsAt || new Date(endsAt).getTime() <= Date.now()) {
      toast.error("Choose a future time for the sale to end.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.put(url, {
        salePrice: typed,
        saleEndsAt: new Date(endsAt).toISOString(),
      });
      onChange(item.id, {
        salePrice: data.item.salePrice,
        saleStartsAt: data.item.saleStartsAt,
        saleEndsAt: data.item.saleEndsAt,
      });
      setSalePrice("");
      setEndsAt("");
      toast.success("Sale started. Customers now see the new price.");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Could not start the sale.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function endSale() {
    setBusy(true);
    try {
      await axios.delete(url);
      onChange(item.id, { salePrice: null, saleStartsAt: null, saleEndsAt: null });
      toast.success("Sale ended. The regular price applies again.");
    } catch {
      toast.error("Could not end the sale.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-background text-foreground disabled:opacity-60";

  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div className="flex items-center gap-2 text-foreground font-medium select-none">
        <Tag className="h-4 w-4 text-destructive" />
        Sale price
      </div>

      {active ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-2">
          <p className="text-sm text-foreground">
            On sale at{" "}
            <span className="font-black">₦{item.salePrice?.toLocaleString()}</span>{" "}
            <span className="text-muted-foreground line-through">
              ₦{regular.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Ends {new Date(item.saleEndsAt as string).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={endSale}
            disabled={busy}
            className="text-sm font-bold text-destructive hover:underline disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            End sale now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Customers pay the sale price until it ends, then the regular price
            (₦{regular.toLocaleString()}) applies again. Your commission is
            charged on what the customer pays.
          </p>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">
              Sale price (₦)
              {percentOff !== null && (
                <span className="ml-2 font-bold text-destructive">
                  {percentOff}% off
                </span>
              )}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder={`Below ${regular.toLocaleString()}`}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">
              Sale ends
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESETS.map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  onClick={() =>
                    setEndsAt(
                      toLocalInput(new Date(Date.now() + p.hours * 3600_000)),
                    )
                  }
                  className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border hover:bg-accent cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={startSale}
            disabled={busy}
            className="w-full h-10 rounded-xl bg-destructive text-white font-bold text-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Start sale
          </button>
        </div>
      )}
    </div>
  );
}
