"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { CategoryScope } from "@prisma/client";

export interface ItemCategoryRow {
  id: string;
  name: string;
  scope: CategoryScope;
  isActive: boolean;
}

interface ItemCategorySectionProps {
  categories: ItemCategoryRow[];
  newName: string;
  newScope: CategoryScope;
  setNewName: (val: string) => void;
  setNewScope: (scope: CategoryScope) => void;
  onAdd: () => Promise<void>;
  onToggle: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busy: boolean;
}

export function ItemCategorySection({
  categories,
  newName,
  newScope,
  setNewName,
  setNewScope,
  onAdd,
  onToggle,
  onDelete,
  busy,
}: ItemCategorySectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        Item / Service Categories
      </h2>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Name (e.g. Skincare)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={newScope}
          onChange={(e) => setNewScope(e.target.value as CategoryScope)}
          className="border border-border rounded-xl px-3 py-2 bg-background text-sm sm:max-w-[160px]"
        >
          <option value="BOTH">Both</option>
          <option value="PRODUCT">Product only</option>
          <option value="SERVICE">Service only</option>
        </select>
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
                {cat.name}
              </p>
              <p className="text-xs text-muted-foreground">{cat.scope}</p>
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
