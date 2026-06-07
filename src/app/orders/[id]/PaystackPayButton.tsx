"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    PaystackPop: {
      setup(config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }): { openIframe(): void };
    };
  }
}

export function PaystackPayButton({
  orderId,
  email,
  amount,
  reference,
  paymentType,
}: {
  orderId: string;
  email: string;
  amount: number;
  reference: string | null;
  paymentType?: "items";
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.PaystackPop) { setScriptReady(true); return; }
    const existing = document.querySelector('script[src*="paystack"]');
    if (existing) { existing.addEventListener("load", () => setScriptReady(true)); return; }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, []);

  async function handlePay() {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!scriptReady || !window.PaystackPop) {
      setError("Payment system not ready. Please refresh the page.");
      return;
    }
    if (!key) {
      setError("Payment not configured. Please contact support.");
      return;
    }

    // Generate a reference on the fly if order was created without one
    const ref = reference || `ERRND-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    setError("");
    setPaying(true);

    // Safety reset — if Paystack never calls back (popup blocked, JS error, etc.)
    const safetyTimer = setTimeout(() => {
      setPaying(false);
      setError("Payment timed out. Please try again.");
    }, 120_000);
    const clearSafety = () => clearTimeout(safetyTimer);

    // Must be a plain function — Paystack v1 rejects async functions
    async function verify(paystackRef: string) {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: paystackRef, orderId, paymentType }),
        });
        if (res.ok) { window.location.reload(); return; }
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Payment verification failed. Contact support.");
      } catch {
        setError("Network error during verification. Please contact support.");
      }
      setPaying(false);
    }

    try {
      window.PaystackPop.setup({
        key,
        email,
        amount: Math.round(amount * 100),
        ref,
        metadata: { orderId },
        callback: function(response) {
          clearSafety();
          verify(response.reference);
        },
        onClose: function() {
          clearSafety();
          setPaying(false);
        },
      }).openIframe();
    } catch (err) {
      clearSafety();
      setPaying(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Payment error: ${msg}`);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-3">
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      <button
        onClick={handlePay}
        disabled={paying || !scriptReady}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3 font-bold text-white text-base transition"
      >
        {paying ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          `Pay ${formatCurrency(amount)} →`
        )}
      </button>
      <p className="text-xs text-center text-gray-400 dark:text-slate-500">
        Secured by Paystack · Card, Bank Transfer, USSD
      </p>
    </div>
  );
}
