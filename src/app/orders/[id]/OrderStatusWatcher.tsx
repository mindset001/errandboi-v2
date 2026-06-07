"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_MESSAGES: Record<string, { emoji: string; text: string }> = {
  accepted:               { emoji: "🏍️", text: "A driver has accepted your order and is on the way!" },
  in_progress:            { emoji: "🚀", text: "Your order is in progress." },
  awaiting_confirmation:  { emoji: "📦", text: "Your driver has marked this complete! Please confirm." },
  completed:              { emoji: "✅", text: "Order completed! Please rate your driver." },
  cancelled:              { emoji: "❌", text: "This order has been cancelled." },
};

export function OrderStatusWatcher({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const supabase = createClient();
  const [toast, setToast] = useState<{ emoji: string; text: string } | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const newStatus = payload.new.status as string;
          if (newStatus !== initialStatus && STATUS_MESSAGES[newStatus]) {
            setToast(STATUS_MESSAGES[newStatus]);
            setTimeout(() => {
              setToast(null);
              window.location.reload();
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, initialStatus, supabase]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl bg-gray-900 dark:bg-slate-700 shadow-xl px-5 py-3.5 text-white max-w-sm">
        <span className="text-2xl">{toast.emoji}</span>
        <p className="text-sm font-medium">{toast.text}</p>
      </div>
    </div>
  );
}
