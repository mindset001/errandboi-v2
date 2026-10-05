"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VehicleType, FareEstimate } from "@/types";
import { estimateFares, formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import PlacesAutocomplete from "@/components/ui/PlacesAutocomplete";

export const dynamic = "force-dynamic";

interface Location { address: string; lat: number; lng: number }

function RideBookingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultType = (params.get("type") as VehicleType) || "bike";

  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [pickup, setPickup] = useState<Location>({ address: "", lat: 0, lng: 0 });
  const [dropoff, setDropoff] = useState<Location>({ address: "", lat: 0, lng: 0 });
  const [selected, setSelected] = useState<VehicleType>(defaultType);
  const [fares, setFares] = useState<FareEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "select" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMinutes: number | null } | null>(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email! });
    });
  }, []);

  async function handleEstimate(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!pickup.address || !dropoff.address) return;
    setEstimating(true);

    let distanceKm = 5;
    let durationMinutes: number | null = null;

    if (pickup.lat && dropoff.lat) {
      try {
        const res = await fetch(
          `/api/route-estimate?originLat=${pickup.lat}&originLng=${pickup.lng}&destLat=${dropoff.lat}&destLng=${dropoff.lng}`
        );
        const data = await res.json();
        if (data.distanceKm) distanceKm = data.distanceKm;
        if (data.durationMinutes) durationMinutes = data.durationMinutes;
      } catch {
        // silently fall back to haversine already handled server-side
      }
    }

    const route = { distanceKm: Math.max(distanceKm, 0.5), durationMinutes };
    setRouteInfo(route);
    setFares(estimateFares(route.distanceKm, route.durationMinutes));
    setEstimating(false);
    setStep("select");
  }

  async function handleConfirm() {
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);

    // The server prices the ride and creates the order; the fare shown here is an estimate.
    let data: { id: string } | null = null;
    let errorMsg = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: "ride",
          vehicle_type: selected,
          pickup_address: pickup.address,
          pickup_lat: pickup.lat || 6.5244,
          pickup_lng: pickup.lng || 3.3792,
          dropoff_address: dropoff.address,
          dropoff_lat: dropoff.lat || 6.5744,
          dropoff_lng: dropoff.lng || 3.3892,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) data = json.order;
      else errorMsg = json.error;
    } catch {
      errorMsg = "Network error. Please try again.";
    }

    setLoading(false);
    if (!data) { setBookingError(errorMsg || "Failed to place order. Please try again."); return; }
    setOrderId(data.id);
    setStep("success");
  }

  const chosenFare = fares.find((f) => f.vehicle_type === selected);

  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center py-16 gap-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Ride booked!</h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-sm">
          Your {selected} has been requested. A driver will be assigned shortly.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.push(`/orders/${orderId}`)}>Track Order</Button>
          <Button variant="outline" onClick={() => { setStep("form"); setPickup({ address: "", lat: 0, lng: 0 }); setDropoff({ address: "", lat: 0, lng: 0 }); }}>
            Book Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl w-full">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mb-2">Book a Ride</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">Choose your vehicle and set your route</p>

      {step === "form" && (
        <form onSubmit={handleEstimate} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-5">
          <PlacesAutocomplete
            label="Pickup location"
            placeholder="Enter pickup address"
            defaultValue={pickup.address}
            icon={<MapPin className="h-4 w-4 text-orange-400" />}
            required
            onSelect={(p) => setPickup(p)}
            onChange={(v) => setPickup((prev) => ({ ...prev, address: v }))}
          />
          <PlacesAutocomplete
            label="Drop-off location"
            placeholder="Enter destination"
            defaultValue={dropoff.address}
            icon={<Navigation className="h-4 w-4 text-gray-400 dark:text-slate-500" />}
            required
            onSelect={(p) => setDropoff(p)}
            onChange={(v) => setDropoff((prev) => ({ ...prev, address: v }))}
          />
          <Button type="submit" loading={estimating} size="lg">
            {estimating ? "Getting route…" : "See available vehicles"}
          </Button>
        </form>
      )}

      {step === "select" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Route</p>
            <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{pickup.address} → {dropoff.address}</p>
            {routeInfo && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold text-orange-500">
                  📍 {routeInfo.distanceKm.toFixed(1)} km
                </span>
                {routeInfo.durationMinutes && (
                  <span className="text-xs font-semibold text-blue-500">
                    🚗 {routeInfo.durationMinutes} min by car
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {fares.map((fare) => (
              <button
                key={fare.vehicle_type}
                onClick={() => setSelected(fare.vehicle_type)}
                className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  selected === fare.vehicle_type
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                    : "border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-200 dark:hover:border-orange-500/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{fare.icon}</span>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-slate-100">{fare.label}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{fare.eta_minutes} min away</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(fare.estimated_fare)}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">estimated</p>
                </div>
              </button>
            ))}
          </div>

          {bookingError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {bookingError}
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Change route</Button>
            <Button onClick={handleConfirm} loading={loading} className="flex-1">
              Confirm — {chosenFare ? formatCurrency(chosenFare.estimated_fare) : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RidePage() {
  return (
    <div className="py-12 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center py-20 text-gray-400 dark:text-slate-500">Loading...</div>}>
        <RideBookingForm />
      </Suspense>
    </div>
  );
}
