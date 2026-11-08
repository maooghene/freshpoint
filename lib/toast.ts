import type { ReactNode } from "react";

/**
 * FreshPoint's own toast system: a tiny store plus the <ToastProvider />
 * component that renders it. The API mirrors what the app already used
 * (toast.success / error / info / warning / promise) so calling code only
 * changes its import.
 */
export type ToastKind = "success" | "error" | "info" | "warning" | "loading";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  content: ReactNode;
  /** Milliseconds before auto-dismiss. 0 keeps it until closed. */
  duration: number;
}

export interface ToastOptions {
  duration?: number;
}

type Listener = () => void;

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
  loading: 0,
};
const MAX_VISIBLE = 4;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): ToastItem[] {
  return items;
}

function add(kind: ToastKind, content: ReactNode, options?: ToastOptions): number {
  const id = nextId++;
  const item: ToastItem = {
    id,
    kind,
    content,
    duration: options?.duration ?? DEFAULT_DURATION[kind],
  };
  items = [...items, item].slice(-MAX_VISIBLE);
  emit();
  return id;
}

function update(id: number, patch: Partial<Omit<ToastItem, "id">>) {
  if (!items.some((t) => t.id === id)) return;
  items = items.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

export function dismissToast(id?: number) {
  items = id === undefined ? [] : items.filter((t) => t.id !== id);
  emit();
}

type Message<T> = string | ((value: T) => string);

function resolve<T>(message: Message<T> | undefined, value: T, fallback: string) {
  if (message === undefined) return fallback;
  return typeof message === "function" ? message(value) : message;
}

export const toast = Object.assign(
  (content: ReactNode, options?: ToastOptions) => add("info", content, options),
  {
    success: (content: ReactNode, options?: ToastOptions) =>
      add("success", content, options),
    error: (content: ReactNode, options?: ToastOptions) =>
      add("error", content, options),
    info: (content: ReactNode, options?: ToastOptions) =>
      add("info", content, options),
    warning: (content: ReactNode, options?: ToastOptions) =>
      add("warning", content, options),
    dismiss: dismissToast,
    /**
     * Shows a spinner toast while the promise runs, then turns it into a
     * success or error toast. Returns the original promise.
     */
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        pending?: string;
        success?: Message<T>;
        error?: Message<unknown>;
      },
    ): Promise<T> => {
      const id = add("loading", messages.pending ?? "Working…");
      promise.then(
        (value) =>
          update(id, {
            kind: "success",
            content: resolve(messages.success, value, "Done"),
            duration: DEFAULT_DURATION.success,
          }),
        (reason) =>
          update(id, {
            kind: "error",
            content: resolve(
              messages.error,
              reason,
              reason instanceof Error ? reason.message : "Something went wrong",
            ),
            duration: DEFAULT_DURATION.error,
          }),
      );
      return promise;
    },
  },
);
