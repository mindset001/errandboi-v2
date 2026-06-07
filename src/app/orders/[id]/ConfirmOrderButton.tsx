"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export function ConfirmOrderButton({
  orderId,
  label,
  disabled,
  disabledReason,
}: {
  orderId: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/orders/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {disabled && disabledReason && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{disabledReason}</p>
      )}
      <button
        onClick={handleConfirm}
        disabled={loading || disabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 font-bold text-white text-base transition"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Confirming…
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
