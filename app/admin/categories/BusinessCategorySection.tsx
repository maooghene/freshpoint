"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, Trash2Icon } from "lucide-react";

export interface BusinessCategoryRow {
  id: string;
  label: string;
  value: string;
  isActive: boolean;
}

interface BusinessCategorySectionProps {
  categories: BusinessCategoryRow[];
  newLabel: string;
  newValue: string;
  setNewLabel: (val: string) => void;
  setNewValue: (val: string) => void;
  onAdd: () => Promise<void>;
  onToggle: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busy: boolean;
}

export function BusinessCategorySection({
  categories,
  newLabel,
  newValue,
  setNewLabel,
  setNewValue,
  onAdd,
  onToggle,
  onDelete,
  busy,
}: BusinessCategorySectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Business Categories</h2>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Label (e.g. Barbershops)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="sm:max-w-xs"
        />
        <Input
          placeholder="Value (e.g. BARBER)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button onClick={onAdd} disabled={busy} className="gap-2 shrink-0">
          <PlusIcon className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border-b border-border last:border-b-0"
          >
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {cat.label}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {cat.value}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggle(cat.id, !cat.isActive)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  cat.isActive
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {cat.isActive ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => onDelete(cat.id)}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
