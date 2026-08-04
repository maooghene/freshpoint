"use client";

import * as React from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface PushNotificationToggleProps {
  businessId: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle({
  businessId,
}: PushNotificationToggleProps) {
  const [supported, setSupported] = React.useState(true);
  const [subscribed, setSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {
        // Service worker not registered yet — normal on first load
      });
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Push notifications are not configured yet.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ) as unknown as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, subscription }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setSubscribed(true);
      toast.success("Instant notifications enabled on this device.");
    } catch (err) {
      console.error("Push subscribe failed:", err);
      toast.error("Could not enable notifications on this device.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      toast.success("Notifications disabled on this device.");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
      toast.error("Could not disable notifications.");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="space-y-3 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">
          Instant device notifications aren&apos;t supported in this browser. On
          iPhone, add FreshPoint to your Home Screen from Safari first, then
          revisit this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      <label className="text-sm font-bold text-foreground block">
        Instant Device Notifications
      </label>
      <p className="text-xs text-muted-foreground">
        Get pinged on this device the moment a new order or booking comes in —
        even with the app closed. Free, no phone number needed.
      </p>
      <button
        type="button"
        onClick={subscribed ? handleDisable : handleEnable}
        disabled={loading}
        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : subscribed ? (
          <Bell className="h-4 w-4 text-emerald-600" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        {subscribed
          ? "Notifications enabled on this device — tap to disable"
          : "Enable notifications on this device"}
      </button>
    </div>
  );
}
