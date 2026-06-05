"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Check for updates on each page load
          reg.update();
        })
        .catch(() => {
          // SW registration failure is non-fatal
        });
    }
  }, []);

  return null;
}
