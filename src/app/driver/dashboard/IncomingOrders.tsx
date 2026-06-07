"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Navigation } from "lucide-react";

type ErrandItem = { name: string; quantity: number; estimated_price?: number; note?: string };

export type IncomingOrder = {
  id: string;
  order_type: string;
  vehicle_type: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  market_name: string | null;
  delivery_address: string | null;
  fare: number | null;
  total: number | null;
  budget: number | null;
  items: ErrandItem[] | null;
  notes: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  status: string;
  created_at: string;
};

const vehicleIcon: Record<string, string> = { bike: "🏍️", car: "🚗", tricycle: "🛺" };

export default function IncomingOrders({
  vehicleType,
  onAccepted,
}: {
  vehicleType: string;
  onAccepted: (order: IncomingOrder) => void;
}) {
  const supabase = createClient();
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, order_type, vehicle_type, pickup_address, dropoff_address, market_name, delivery_address, fare, total, budget, items, notes, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, delivery_lat, delivery_lng, status, created_at")
      .eq("status", "pending")
      .eq("order_type", "ride")
      .is("driver_id", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const filtered = (data ?? []).filter((o) => o.vehicle_type === vehicleType);
        setOrders(filtered as IncomingOrder[]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  useEffect(() => {
    const channel = supabase
      .channel("incoming-orders-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as IncomingOrder & { driver_id: string | null };
          if (o.status === "pending" && !o.driver_id && o.order_type === "ride" && o.vehicle_type === vehicleType) {
            setOrders((prev) => [o, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as IncomingOrder & { driver_id: string | null };
          if (o.status !== "pending" || o.driver_id !== null) {
            setOrders((prev) => prev.filter((x) => x.id !== o.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  async function accept(order: IncomingOrder) {
    setAccepting(order.id);
    setErrorMap((prev) => { const next = { ...prev }; delete next[order.id]; return next; });

    const res = await fetch("/api/orders/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const json = await res.json();
    setAccepting(null);

    if (!res.ok) {
      if (res.status === 409) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        setErrorMap((prev) => ({ ...prev, [order.id]: json.error ?? "Failed to accept" }));
      }
      return;
    }

    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    onAccepted({ ...order, status: "accepted" });
  }

  if (orders.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-white font-bold text-lg">New Requests</h2>
        <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {orders.map((order) => {
        const isRide = order.order_type === "ride";
        const amount = order.fare ?? order.total ?? 0;
        const icon = isRide ? (vehicleIcon[order.vehicle_type ?? ""] ?? "🚗") : "🛒";

        return (
          <div
            key={order.id}
            className="bg-orange-500/8 border border-orange-500/25 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-500/15">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold text-white capitalize">
                  {isRide ? `${order.vehicle_type} Ride` : "Market Errand"}
                </span>
              </div>
              <span className="text-lg font-extrabold text-orange-400">{formatCurrency(amount)}</span>
            </div>

            {/* Route */}
            <div className="px-5 py-4 flex flex-col gap-2.5">
              {isRide ? (
                <>
                  <RouteRow color="bg-orange-500" label="Pickup" value={order.pickup_address} />
                  <RouteRow color="bg-slate-500" label="Drop-off" value={order.dropoff_address} />
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-lg flex-shrink-0">🏪</span>
                    <div>
                      <p className="text-xs text-slate-500">Market</p>
                      <p className="text-slate-200 font-medium">{order.market_name}</p>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                      <p className="text-xs text-slate-500 font-medium">{order.items.length} items to buy</p>
                      {order.items.slice(0, 4).map((item, i) => (
                        <p key={i} className="text-sm text-slate-300">{item.quantity}× {item.name}</p>
                      ))}
                      {order.items.length > 4 && (
                        <p className="text-xs text-slate-500">+{order.items.length - 4} more…</p>
                      )}
                      {order.budget ? (
                        <p className="text-xs text-orange-400 pt-1 border-t border-slate-700 mt-0.5">Budget: {formatCurrency(order.budget)}</p>
                      ) : null}
                    </div>
                  )}
                  <RouteRow color="bg-slate-500" label="Deliver to" value={order.delivery_address} />
                </>
              )}

              {errorMap[order.id] && (
                <p className="text-xs text-red-400">{errorMap[order.id]}</p>
              )}

              <button
                onClick={() => accept(order)}
                disabled={accepting === order.id}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-4 py-2.5 text-sm font-bold text-white transition w-full"
              >
                {accepting === order.id ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Accepting…
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" />
                    Accept Order
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RouteRow({ color, label, value }: { color: string; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className={`h-2.5 w-2.5 rounded-full ${color} mt-1 flex-shrink-0`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-slate-200">{value ?? "—"}</p>
      </div>
    </div>
  );
}
