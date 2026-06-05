"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production — in dev the SW caches stale redirects
    // and makes debugging impossible.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => reg.update())
      .catch(() => {});
  }, []);

  return null;
}
