"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

export default function PushSubscriber() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setPermission("granted");
    } catch {
      setPermission(Notification.permission);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPermission("default");
    } catch {
      // ignore
    }
    setLoading(false);
  }

  if (!supported) return null;

  if (permission === "granted") {
    return (
      <button
        onClick={unsubscribe}
        disabled={loading}
        title="Turn off notifications"
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
      >
        <BellOff className="h-4 w-4" />
        <span className="hidden sm:inline">Notifications on</span>
      </button>
    );
  }

  if (permission === "denied") return null;

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 px-3 py-1.5 text-sm font-semibold text-orange-400 transition disabled:opacity-50"
    >
      <Bell className="h-4 w-4" />
      {loading ? "Enabling…" : "Enable notifications"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
