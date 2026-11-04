"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "freshpoint-install-dismissed-at";
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Invites people to add FreshPoint to their home screen. Android/desktop
 * Chrome use the native install prompt; iPhone Safari has no such prompt, so
 * we show the two-step "Add to Home Screen" instruction instead.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || recentlyDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIos && isSafari) setShowIos(true);

    // Wait a little so the prompt never covers the first thing people see.
    const timer = window.setTimeout(() => setVisible(true), 8000);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || (!deferred && !showIos)) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage unavailable: the prompt simply returns next visit.
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install FreshPoint"
      className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl md:left-auto md:right-4 md:w-80"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight">Get the FreshPoint app</p>
          {deferred ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Open FreshPoint straight from your home screen, like any other app.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tap <Share className="mx-0.5 inline size-3.5 align-text-bottom" />{" "}
              <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>
      </div>
      {deferred && (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Download className="size-4" /> Install app
        </button>
      )}
    </div>
  );
}
