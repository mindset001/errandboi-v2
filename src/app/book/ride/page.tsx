"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VehicleType, FareEstimate } from "@/types";
import { estimateFares, haversineDistance, formatCurrency, generateReference } from "@/lib/utils";
import Button from "@/components/ui/Button";
import PlacesAutocomplete from "@/components/ui/PlacesAutocomplete";

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email! });
    });
  }, []);

  function handleEstimate(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!pickup.address || !dropoff.address) return;

    // Use real coordinates if both are set, otherwise fall back to 5 km demo
    const dist =
      pickup.lat && dropoff.lat
        ? haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
        : 5;

    setFares(estimateFares(Math.max(dist, 0.5)));
    setStep("select");
  }

  async function handleConfirm() {
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);

    const chosenFare = fares.find((f) => f.vehicle_type === selected)!;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "ride",
        vehicle_type: selected,
        pickup_address: pickup.address,
        pickup_lat: pickup.lat || 6.5244,
        pickup_lng: pickup.lng || 3.3792,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat || 6.5744,
        dropoff_lng: dropoff.lng || 3.3892,
        fare: chosenFare.estimated_fare,
        status: "pending",
        payment_reference: generateReference(),
      })
      .select()
      .single();

    setLoading(false);
    if (error) { setBookingError(error.message || "Failed to place order. Please try again."); return; }
    if (data) { setOrderId(data.id); setStep("success"); }
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
          <Button type="submit" size="lg">See available vehicles</Button>
        </form>
      )}

      {step === "select" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Route</p>
            <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{pickup.address} → {dropoff.address}</p>
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
