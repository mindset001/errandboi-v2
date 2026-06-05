"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Phone, CheckCircle, Navigation, Wifi, WifiOff, LogOut } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  rating: number;
  is_available: boolean;
  latitude: number | null;
  longitude: number | null;
};

type Order = {
  id: string;
  order_type: string;
  vehicle_type: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  market_name: string | null;
  delivery_address: string | null;
  fare: number | null;
  total: number | null;
  status: string;
  created_at: string;
};

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  pending: { label: "Accept Order", next: "accepted" },
  accepted: { label: "Start Trip", next: "in_progress" },
  in_progress: { label: "Complete", next: "completed" },
};

const vehicleIcon: Record<string, string> = { bike: "🏍️", car: "🚗", tricycle: "🛺" };

export default function DriverClient({
  driver: initialDriver,
  initialOrders,
}: {
  driver: Driver;
  initialOrders: Order[];
}) {
  const supabase = createClient();
  const [driver, setDriver] = useState(initialDriver);
  const [orders, setOrders] = useState(initialOrders);
  const [locationStatus, setLocationStatus] = useState<"idle" | "active" | "denied">("idle");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationStatus("active");
        await supabase
          .from("drivers")
          .update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          .eq("id", driver.id);
      },
      () => setLocationStatus("denied")
    );
  }, [driver.id, supabase]);

  // Send location every 15 seconds while tab is active
  useEffect(() => {
    sendLocation();
    const interval = setInterval(sendLocation, 15_000);
    return () => clearInterval(interval);
  }, [sendLocation]);

  async function toggleAvailability() {
    const next = !driver.is_available;
    setDriver((d) => ({ ...d, is_available: next }));
    await supabase.from("drivers").update({ is_available: next }).eq("id", driver.id);
  }

  async function advanceStatus(orderId: string, nextStatus: string) {
    setActionLoading(orderId);
    await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
    if (nextStatus === "completed") {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o));
    }
    setActionLoading(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/driver/login";
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xl">
              {vehicleIcon[driver.vehicle_type] ?? "🚗"}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{driver.full_name}</p>
              <p className="text-xs text-slate-400">{driver.vehicle_plate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAvailability}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                driver.is_available
                  ? "bg-green-500/20 text-green-400"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {driver.is_available ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {driver.is_available ? "Online" : "Offline"}
            </button>
            <button onClick={handleSignOut} className="rounded-xl p-2 text-slate-500 hover:text-slate-300 transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Location status */}
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
          locationStatus === "active"
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : locationStatus === "denied"
            ? "bg-red-500/10 border border-red-500/20 text-red-400"
            : "bg-slate-800 border border-slate-700 text-slate-400"
        }`}>
          <MapPin className="h-4 w-4 flex-shrink-0" />
          {locationStatus === "active"
            ? "Location sharing active — customers can track you"
            : locationStatus === "denied"
            ? "Location access denied — customers can't track you"
            : "Acquiring your location…"}
        </div>

        {/* Orders */}
        <h2 className="text-white font-bold text-lg">
          {orders.length === 0 ? "No active orders" : `Active Orders (${orders.length})`}
        </h2>

        {orders.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <Navigation className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Waiting for new assignments…</p>
          </div>
        )}

        {orders.map((order) => {
          const isRide = order.order_type === "ride";
          const action = STATUS_NEXT[order.status];
          const amount = order.fare ?? order.total ?? 0;

          return (
            <div key={order.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              {/* Order header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{isRide ? (vehicleIcon[order.vehicle_type ?? ""] ?? "🚗") : "🛒"}</span>
                  <span className="font-semibold text-white capitalize">
                    {isRide ? `${order.vehicle_type} Ride` : "Market Errand"}
                  </span>
                </div>
                <span className={`text-xs font-semibold rounded-full px-3 py-1 ${
                  order.status === "pending" ? "bg-yellow-400/10 text-yellow-400"
                  : order.status === "accepted" ? "bg-blue-400/10 text-blue-400"
                  : "bg-indigo-400/10 text-indigo-300"
                }`}>
                  {order.status === "in_progress" ? "In Progress" : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Route/details */}
              <div className="px-5 py-4 flex flex-col gap-2.5">
                {isRide ? (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <div className="h-2.5 w-2.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Pickup</p>
                        <p className="text-slate-200">{order.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Drop-off</p>
                        <p className="text-slate-200">{order.dropoff_address}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-lg flex-shrink-0">🏪</span>
                      <div>
                        <p className="text-xs text-slate-500">Market</p>
                        <p className="text-slate-200">{order.market_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Deliver to</p>
                        <p className="text-slate-200">{order.delivery_address}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-1">
                  <span className="font-bold text-orange-400">{formatCurrency(amount)}</span>
                  {action && (
                    <button
                      onClick={() => advanceStatus(order.id, action.next)}
                      disabled={actionLoading === order.id}
                      className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {actionLoading === order.id ? "Updating…" : action.label}
                    </button>
                  )}
                </div>
              </div>

              {/* Call support link */}
              <div className="px-5 pb-4">
                <a
                  href="tel:+234"
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition"
                >
                  <Phone className="h-3.5 w-3.5" /> Contact support
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
