"use client";

import * as React from "react";
import { Tags } from "lucide-react";
import { Label } from "@/components/ui/label";

export const MAX_EXTRA_CATEGORIES = 2;

export interface CategoryOption {
  label: string;
  value: string;
}

interface CategoryPickerProps {
  options: CategoryOption[];
  /** Stored list: the first entry is the main category, the rest are extras. */
  initial?: string[];
  disabled?: boolean;
  error?: string;
  /**
   * "multi": one hidden `categories` input per value, main first (registration).
   * "comma": a single comma-separated `categories` input (settings).
   */
  format?: "multi" | "comma";
}

function Chip({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`min-h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * A business has ONE main category (what it mainly is: it decides where it
 * shows up when customers filter) and up to two extras for other things it
 * also offers. The saved order is main first, then extras.
 */
export function CategoryPicker({
  options,
  initial = [],
  disabled,
  error,
  format = "multi",
}: CategoryPickerProps) {
  const known = new Set(options.map((o) => o.value));
  const clean = initial.filter((v) => known.has(v));
  const [main, setMain] = React.useState<string>(clean[0] ?? "");
  const [extras, setExtras] = React.useState<string[]>(
    clean.slice(1, 1 + MAX_EXTRA_CATEGORIES),
  );

  const chooseMain = (value: string) => {
    setMain(value);
    setExtras((prev) => prev.filter((v) => v !== value));
  };

  const toggleExtra = (value: string) => {
    setExtras((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length >= MAX_EXTRA_CATEGORIES
          ? prev
          : [...prev, value],
    );
  };

  const ordered = main ? [main, ...extras] : [];

  return (
    <div className="space-y-5">
      {format === "comma" ? (
        <input type="hidden" name="categories" value={ordered.join(",")} />
      ) : (
        ordered.map((v) => (
          <input key={v} type="hidden" name="categories" value={v} />
        ))
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2 font-bold text-foreground">
          <Tags className="h-4 w-4 text-muted-foreground" />
          Main category
        </Label>
        <p className="text-xs font-medium text-muted-foreground">
          What your business mainly is. Customers find you under this when they
          filter.
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {options.map((o) => (
            <Chip
              key={o.value}
              selected={main === o.value}
              disabled={disabled}
              onClick={() => chooseMain(o.value)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-foreground">
          Also offers{" "}
          <span className="text-[11px] font-medium text-muted-foreground">
            (optional, up to {MAX_EXTRA_CATEGORIES})
          </span>
        </Label>
        <p className="text-xs font-medium text-muted-foreground">
          Other things you sell. For example a salon that also sells jewelry.
          These show on your page but not in the category filter.
        </p>
        <div className="flex flex-wrap gap-2">
          {options
            .filter((o) => o.value !== main)
            .map((o) => {
              const selected = extras.includes(o.value);
              return (
                <Chip
                  key={o.value}
                  selected={selected}
                  disabled={
                    disabled ||
                    !main ||
                    (!selected && extras.length >= MAX_EXTRA_CATEGORIES)
                  }
                  onClick={() => toggleExtra(o.value)}
                >
                  {o.label}
                </Chip>
              );
            })}
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}
