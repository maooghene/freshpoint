"use client";

import { useEffect } from "react";

/** Registers the service worker so the app is installable and works offline-friendly. */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("SW registration failed:", error));
  }, []);
  return null;
}
