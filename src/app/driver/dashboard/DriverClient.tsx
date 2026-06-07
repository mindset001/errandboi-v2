"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin, Phone, CheckCircle, Navigation, Wifi, WifiOff,
  LogOut, Home, User, UploadCloud, Star, TrendingUp, Banknote, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { driverPayout } from "@/lib/commission";
import IncomingOrders, { type IncomingOrder } from "./IncomingOrders";

const DriverMap = dynamic(() => import("./DriverMap"), { ssr: false });

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
  license_number: string | null;
  nin: string | null;
  license_url: string | null;
  nin_url: string | null;
  profile_photo_url: string | null;
  home_address: string | null;
};

type ErrandItem = { name: string; quantity: number; estimated_price?: number; note?: string };

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
  budget: number | null;
  items: ErrandItem[] | null;
  notes: string | null;
  status: string;
  created_at: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
};

type Tab = "home" | "earnings" | "profile";

const RIDE_ACTIONS: Record<string, { label: string; next: string }> = {
  accepted: { label: "Start Trip", next: "in_progress" },
  in_progress: { label: "Complete Trip", next: "awaiting_confirmation" },
};
const ERRAND_ACTIONS: Record<string, { label: string; next: string }> = {
  accepted: { label: "Start Shopping", next: "in_progress" },
  in_progress: { label: "Mark Delivered", next: "awaiting_confirmation" },
};
function getAction(order: Order) {
  return (order.order_type === "errand" ? ERRAND_ACTIONS : RIDE_ACTIONS)[order.status] ?? null;
}

const vehicleIcon: Record<string, string> = { bike: "🏍️", car: "🚗", tricycle: "🛺" };

export default function DriverClient({
  driver: initialDriver,
  initialOrders,
  pending = false,
}: {
  driver: Driver;
  initialOrders: Order[];
  pending?: boolean;
}) {
  const supabase = createClient();
  const [driver, setDriver] = useState(initialDriver);
  const [orders, setOrders] = useState(initialOrders);
  const [locationStatus, setLocationStatus] = useState<"idle" | "active" | "denied">("idle");
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number } | null>(
    initialDriver.latitude && initialDriver.longitude
      ? { lat: initialDriver.latitude, lng: initialDriver.longitude }
      : null
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(pending ? "profile" : "home");

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationStatus("active");
        setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        await supabase
          .from("drivers")
          .update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          .eq("id", driver.id);
      },
      () => setLocationStatus("denied")
    );
  }, [driver.id, supabase]);

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

  function handleOrderAccepted(order: IncomingOrder) {
    setOrders((prev) => [order as Order, ...prev]);
  }

  async function advanceStatus(orderId: string, nextStatus: string) {
    setActionLoading(orderId);
    await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
    // Remove from active list once driver's job is done
    if (nextStatus === "completed" || nextStatus === "awaiting_confirmation") {
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

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { id: "earnings", label: "Earnings", icon: <TrendingUp className="h-5 w-5" /> },
    { id: "profile", label: "Profile & KYC", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 border-r border-slate-800 min-h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-lg">
              {vehicleIcon[driver.vehicle_type] ?? "🚗"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{driver.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{driver.vehicle_plate || "No plate"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors w-full text-left ${
                tab === item.id
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === "profile" && pending && (
                <span className="ml-auto h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: status + sign out */}
        <div className="px-3 py-4 border-t border-slate-800 flex flex-col gap-2">
          {!pending && (
            <button
              onClick={toggleAvailability}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition w-full ${
                driver.is_available
                  ? "bg-green-500/15 text-green-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {driver.is_available ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {driver.is_available ? "Online" : "Go Online"}
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition w-full"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
              {vehicleIcon[driver.vehicle_type] ?? "🚗"}
            </div>
            <p className="font-bold text-white text-sm">{driver.full_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {pending ? (
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">⏳ Under Review</span>
            ) : (
              <button
                onClick={toggleAvailability}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  driver.is_available ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"
                }`}
              >
                {driver.is_available ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {driver.is_available ? "Online" : "Offline"}
              </button>
            )}
            <button onClick={handleSignOut} className="p-1.5 text-slate-500 hover:text-slate-300 transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {tab === "home" ? (
            <HomeTab
              driver={driver}
              orders={orders}
              locationStatus={locationStatus}
              actionLoading={actionLoading}
              pending={pending}
              gpsPos={gpsPos}
              advanceStatus={advanceStatus}
              onOrderAccepted={handleOrderAccepted}
            />
          ) : tab === "earnings" ? (
            <EarningsTab driverId={driver.id} />
          ) : (
            <ProfileTab
              driver={driver}
              pending={pending}
              onDocUploaded={(slot, url) =>
                setDriver((d) => ({ ...d, [`${slot}_url`]: url }))
              }
              onProfileSaved={(fields) => setDriver((d) => ({ ...d, ...fields }))}
            />
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative ${
                tab === item.id ? "text-orange-400" : "text-slate-500"
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === "profile" && pending && (
                <span className="absolute top-2 right-[calc(50%-16px)] h-2 w-2 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Home Tab ─────────────────────────────────────────────── */

function HomeTab({
  driver, orders, locationStatus, actionLoading, pending, gpsPos, advanceStatus, onOrderAccepted,
}: {
  driver: Driver;
  orders: Order[];
  locationStatus: "idle" | "active" | "denied";
  actionLoading: string | null;
  pending: boolean;
  gpsPos: { lat: number; lng: number } | null;
  advanceStatus: (id: string, next: string) => void;
  onOrderAccepted: (order: IncomingOrder) => void;
}) {
  const activeOrders = orders.filter((o) => o.status !== "pending");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-4">
      {pending && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
          <p className="font-semibold mb-0.5">Account under review</p>
          <p className="text-amber-400/70 text-xs">
            Your profile has been submitted. The admin will review and approve your account shortly.
            Go to <span className="font-semibold text-amber-300">Profile & KYC</span> to upload your documents if you haven&apos;t already.
          </p>
        </div>
      )}

      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
        locationStatus === "active"
          ? "bg-green-500/10 border border-green-500/20 text-green-400"
          : locationStatus === "denied"
          ? "bg-red-500/10 border border-red-500/20 text-red-400"
          : "bg-slate-800 border border-slate-700 text-slate-400"
      }`}>
        <MapPin className="h-4 w-4 flex-shrink-0" />
        {locationStatus === "active"
          ? "Location sharing active"
          : locationStatus === "denied"
          ? "Location access denied — enable it for order tracking"
          : "Acquiring your location…"}
      </div>

      {/* Incoming requests — only for approved drivers */}
      {!pending && (
        <IncomingOrders
          vehicleType={driver.vehicle_type}
          onAccepted={onOrderAccepted}
        />
      )}

      {/* Active orders */}
      <h2 className="text-white font-bold text-lg">
        {activeOrders.length === 0 ? "No active orders" : `Active Orders (${activeOrders.length})`}
      </h2>

      {activeOrders.length === 0 && (
        <div className="text-center py-14 text-slate-600">
          <Navigation className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{pending ? "You'll receive orders after your account is approved." : "Waiting for new assignments…"}</p>
        </div>
      )}

      {activeOrders.map((order) => {
        const isRide = order.order_type === "ride";
        const action = getAction(order);
        const amount = order.fare ?? order.total ?? 0;

        const mapActive = (order.status === "accepted" || order.status === "in_progress");
        const showMap = mapActive && (
          isRide
            ? (order.pickup_lat && order.pickup_lng)
            : (order.delivery_lat && order.delivery_lng)
        );

        const errandStatusLabel: Record<string, string> = {
          accepted: "Shopping",
          in_progress: "Out for Delivery",
        };
        const statusLabel = isRide
          ? (order.status === "in_progress" ? "In Progress" : "Accepted")
          : (errandStatusLabel[order.status] ?? order.status);

        return (
          <div key={order.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{isRide ? (vehicleIcon[order.vehicle_type ?? ""] ?? "🚗") : "🛒"}</span>
                <span className="font-semibold text-white capitalize">
                  {isRide ? `${order.vehicle_type} Ride` : "Market Errand"}
                </span>
              </div>
              <span className={`text-xs font-semibold rounded-full px-3 py-1 ${
                order.status === "accepted" ? "bg-blue-400/10 text-blue-400"
                : "bg-indigo-400/10 text-indigo-300"
              }`}>
                {statusLabel}
              </span>
            </div>
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
                    <div><p className="text-xs text-slate-500">Market</p><p className="text-slate-200 font-medium">{order.market_name}</p></div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="bg-slate-800 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                      <p className="text-xs text-slate-500 font-medium">Shopping list ({order.items.length} items)</p>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-200">{item.quantity}× {item.name}</span>
                          {item.estimated_price ? (
                            <span className="text-slate-500 text-xs">{formatCurrency(item.estimated_price * item.quantity)}</span>
                          ) : null}
                        </div>
                      ))}
                      {order.budget ? (
                        <p className="text-xs text-orange-400 mt-1 pt-1.5 border-t border-slate-700">Budget: {formatCurrency(order.budget)}</p>
                      ) : null}
                      {order.notes ? (
                        <p className="text-xs text-amber-400/80 mt-0.5">Note: {order.notes}</p>
                      ) : null}
                    </div>
                  )}
                  <RouteRow color="bg-slate-500" label="Deliver to" value={order.delivery_address} icon={<MapPin className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />} />
                </>
              )}

              {showMap && (
                <DriverMap
                  driverLat={gpsPos?.lat ?? null}
                  driverLng={gpsPos?.lng ?? null}
                  pickupLat={isRide ? order.pickup_lat! : order.delivery_lat!}
                  pickupLng={isRide ? order.pickup_lng! : order.delivery_lng!}
                  dropoffLat={isRide ? order.dropoff_lat : null}
                  dropoffLng={isRide ? order.dropoff_lng : null}
                />
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
            <div className="px-5 pb-4">
              <a href="tel:+234" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition">
                <Phone className="h-3.5 w-3.5" /> Contact support
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RouteRow({ color, label, value, icon }: { color?: string; label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon ?? <div className={`h-2.5 w-2.5 rounded-full ${color} mt-1 flex-shrink-0`} />}
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-slate-200">{value}</p></div>
    </div>
  );
}

/* ── Earnings Tab ─────────────────────────────────────────── */

type Withdrawal = {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: "pending" | "paid" | "rejected";
  admin_note: string | null;
  created_at: string;
};

function EarningsTab({ driverId }: { driverId: string }) {
  const supabase = createClient();
  const [trips, setTrips] = useState<{ id: string; order_type: string; fare: number | null; total: number | null; created_at: string }[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("id, order_type, fare, total, created_at").eq("driver_id", driverId).eq("status", "completed").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("id, amount, bank_name, account_number, account_name, status, admin_note, created_at").eq("driver_id", driverId).order("created_at", { ascending: false }),
    ]).then(([{ data: o }, { data: w }]) => {
      setTrips(o ?? []);
      setWithdrawals((w ?? []) as Withdrawal[]);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const tripAmount = (t: typeof trips[0]) => driverPayout(t.fare ?? t.total ?? 0);
  const totalEarned = trips.reduce((sum, t) => sum + tripAmount(t), 0);
  const totalCommitted = withdrawals
    .filter((w) => w.status === "pending" || w.status === "paid")
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const available = totalEarned - totalCommitted;

  const today = new Date().toDateString();
  const todayTotal = trips.filter((t) => new Date(t.created_at).toDateString() === today).reduce((sum, t) => sum + tripAmount(t), 0);
  const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const weekTotal = trips.filter((t) => new Date(t.created_at) >= thisWeekStart).reduce((sum, t) => sum + tripAmount(t), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-5">
      {/* Period summary */}
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Today", value: todayTotal }, { label: "This Week", value: weekTotal }, { label: "All Time", value: totalEarned }].map((s) => (
          <div key={s.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-lg font-extrabold text-orange-400">{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Available balance + withdraw */}
      <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-green-400 font-medium">Available to withdraw</p>
          <Banknote className="h-5 w-5 text-green-400" />
        </div>
        <p className="text-3xl font-extrabold text-white mb-4">{formatCurrency(Math.max(available, 0))}</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          disabled={loading || available < 1000}
          className="flex items-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-bold text-white transition"
        >
          {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {available < 1000 ? "Min. ₦1,000 to withdraw" : "Request Withdrawal"}
        </button>
      </div>

      {showForm && (
        <WithdrawalForm
          available={available}
          onSuccess={(w) => { setWithdrawals((prev) => [w, ...prev]); setShowForm(false); }}
        />
      )}

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-white font-bold text-sm">Withdrawal Requests</h3>
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">{w.bank_name} · {w.account_number}</p>
                <p className="text-xs text-slate-500">{new Date(w.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                {w.admin_note && <p className="text-xs text-slate-400 mt-0.5">{w.admin_note}</p>}
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-bold text-white">{formatCurrency(Number(w.amount))}</p>
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                  w.status === "paid" ? "bg-green-500/15 text-green-400"
                  : w.status === "rejected" ? "bg-red-500/15 text-red-400"
                  : "bg-yellow-500/15 text-yellow-400"
                }`}>
                  {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">{loading ? "Loading…" : `${trips.length} completed trips`}</h3>
        <span className="text-xs text-slate-500">After 15% platform fee</span>
      </div>

      {loading && <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>}
      {!loading && trips.length === 0 && (
        <div className="text-center py-14 text-slate-600">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No completed trips yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200 capitalize">{trip.order_type === "ride" ? "🏍️ Ride" : "🛒 Errand"}</p>
              <p className="text-xs text-slate-500">{new Date(trip.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-400">{formatCurrency(tripAmount(trip))}</p>
              <p className="text-xs text-slate-600">{formatCurrency(trip.fare ?? trip.total ?? 0)} gross</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WithdrawalForm({ available, onSuccess }: { available: number; onSuccess: (w: Withdrawal) => void }) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt < 1000) { setError("Minimum withdrawal is ₦1,000"); return; }
    if (amt > available) { setError(`Max available is ${formatCurrency(available)}`); return; }
    setError(""); setSubmitting(true);

    const res = await fetch("/api/driver/withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, bank_name: bankName, account_number: accountNumber, account_name: accountName }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error ?? "Failed to submit"); return; }
    onSuccess({
      id: crypto.randomUUID(),
      amount: amt,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      status: "pending",
      admin_note: null,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
      <h3 className="text-white font-bold text-sm">Withdrawal Details</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Amount (₦)</label>
        <input
          type="number"
          min={1000}
          max={available}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 5000"
          required
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
        />
        <p className="text-xs text-slate-500">Available: {formatCurrency(available)} · Min: ₦1,000</p>
      </div>

      {[
        { label: "Bank name", value: bankName, set: setBankName, placeholder: "e.g. Access Bank" },
        { label: "Account number", value: accountNumber, set: setAccountNumber, placeholder: "10-digit account number" },
        { label: "Account name", value: accountName, set: setAccountName, placeholder: "Name on account" },
      ].map((f) => (
        <div key={f.label} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">{f.label}</label>
          <input
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
            placeholder={f.placeholder}
            required
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
          />
        </div>
      ))}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 px-4 py-3 font-bold text-sm text-white transition flex items-center justify-center gap-2"
      >
        {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
        {submitting ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}

/* ── Profile / KYC Tab ────────────────────────────────────── */

function ProfileTab({
  driver, pending, onDocUploaded, onProfileSaved,
}: {
  driver: Driver;
  pending: boolean;
  onDocUploaded: (slot: "license" | "nin" | "photo", url: string) => void;
  onProfileSaved: (fields: Partial<Driver>) => void;
}) {
  const supabase = createClient();
  const [vehicleType, setVehicleType] = useState(driver.vehicle_type || "bike");
  const [vehiclePlate, setVehiclePlate] = useState(driver.vehicle_plate || "");
  const [licenseNumber, setLicenseNumber] = useState(driver.license_number || "");
  const [nin, setNin] = useState(driver.nin || "");
  const [homeAddress, setHomeAddress] = useState(driver.home_address || "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    const fields = {
      vehicle_type: vehicleType,
      vehicle_plate: vehiclePlate.trim().toUpperCase(),
      license_number: licenseNumber.trim().toUpperCase(),
      nin: nin.trim() || null,
      home_address: homeAddress.trim() || null,
    };
    const { error } = await supabase.from("drivers").update(fields).eq("id", driver.id);
    setSaving(false);
    if (error) { setSaveStatus("error"); setSaveError(error.message); return; }
    setSaveStatus("saved");
    onProfileSaved(fields);
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-6">
      {/* Profile photo + name header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex items-center gap-4">
        <PhotoUploadField
          currentUrl={driver.profile_photo_url}
          onUploaded={(url) => onDocUploaded("photo", url)}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{driver.full_name}</h2>
          <p className="text-slate-400 text-sm">{driver.phone}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
              <Star className="h-3.5 w-3.5 fill-yellow-400" />
              {Number(driver.rating).toFixed(1)}
            </div>
            {pending && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Pending approval</span>
            )}
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Vehicle & Identity</h3>

        {pending && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-300">
            Fill in your details and upload documents below to speed up approval.
          </div>
        )}

        {/* Vehicle type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Vehicle type</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
          >
            <option value="bike">🏍️ Motorcycle / Bike</option>
            <option value="tricycle">🛺 Tricycle (Keke)</option>
            <option value="car">🚗 Car</option>
          </select>
        </div>

        <EditField label="Vehicle plate number" value={vehiclePlate} onChange={setVehiclePlate} placeholder="ABC-123-XY" mono />
        <EditField label="Driver's license number" value={licenseNumber} onChange={setLicenseNumber} placeholder="LSD-02345-A" mono />
        <EditField label="NIN (optional)" value={nin} onChange={setNin} placeholder="12345678901" mono />

        {/* Home address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Full home address</label>
          <textarea
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            placeholder="e.g. 12 Bode Thomas Street, Surulere, Lagos"
            rows={2}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition resize-none"
          />
        </div>

        {saveStatus === "error" && (
          <p className="text-xs text-red-400">{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded-xl px-4 py-3 font-semibold text-sm transition ${
            saveStatus === "saved"
              ? "bg-green-500/20 text-green-400"
              : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60"
          }`}
        >
          {saving ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Save Details"}
        </button>
      </div>

      {/* KYC document uploads */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">KYC Documents</h3>
        <DocUploadField
          slot="license"
          label="Driver's License photo"
          currentUrl={driver.license_url}
          onUploaded={(url) => onDocUploaded("license", url)}
        />
        <DocUploadField
          slot="nin"
          label="NIN Slip / National ID Card"
          currentUrl={driver.nin_url}
          onUploaded={(url) => onDocUploaded("nin", url)}
        />
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, placeholder, mono }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function PhotoUploadField({ currentUrl, onUploaded }: {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("slot", "photo");
    fd.append("file", file);
    const res = await fetch("/api/driver/kyc-upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (res.ok) { setLocalUrl(json.url); onUploaded(json.url); }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="relative h-16 w-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 hover:border-orange-500/50 transition flex-shrink-0 group"
      title="Upload profile photo"
    >
      {localUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={localUrl} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <span className="text-2xl">{uploading ? "" : "👤"}</span>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
          <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        <UploadCloud className="h-5 w-5 text-white" />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </button>
  );
}

function DocUploadField({
  slot, label, currentUrl, onUploaded,
}: {
  slot: "license" | "nin";
  label: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localUrl, setLocalUrl] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("slot", slot);
    fd.append("file", file);
    const res = await fetch("/api/driver/kyc-upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) { setError(json.error ?? "Upload failed"); return; }
    setLocalUrl(json.url);
    onUploaded(json.url);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {localUrl && (
          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
          >
            View uploaded ↗
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition w-full text-left ${
          localUrl
            ? "border-green-500/40 bg-green-500/5 hover:border-green-500/60"
            : "border-slate-700 bg-slate-800/50 hover:border-orange-500/50 hover:bg-slate-800"
        } disabled:opacity-60`}
      >
        {uploading ? (
          <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin flex-shrink-0" />
        ) : localUrl ? (
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <UploadCloud className="h-5 w-5 text-slate-400 flex-shrink-0" />
        )}
        <span className={`text-sm ${localUrl ? "text-green-400" : "text-slate-400"}`}>
          {uploading ? "Uploading…" : localUrl ? "Document uploaded — click to replace" : "Click to upload (image or PDF)"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
