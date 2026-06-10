"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PwaRedirect() {
  const router = useRouter();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      router.replace("/auth/login");
    }
  }, [router]);

  return null;
}
