"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VehicleType, FareEstimate } from "@/types";
import { estimateFares, haversineDistance, formatCurrency, generateReference } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const DEMO_COORDS = { lat: 6.5244, lng: 3.3792 }; // Lagos

function RideBookingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultType = (params.get("type") as VehicleType) || "bike";

  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selected, setSelected] = useState<VehicleType>(defaultType);
  const [fares, setFares] = useState<FareEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "select" | "confirm" | "success">("form");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email! });
    });
  }, []);

  function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    // Demo: random distance 2–15 km
    const dist = 2 + Math.random() * 13;
    setFares(estimateFares(dist));
    setStep("select");
  }

  async function handleConfirm() {
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);

    const chosenFare = fares.find((f) => f.vehicle_type === selected)!;
    const ref = generateReference();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "ride",
        vehicle_type: selected,
        pickup_address: pickup,
        pickup_lat: DEMO_COORDS.lat,
        pickup_lng: DEMO_COORDS.lng,
        dropoff_address: dropoff,
        dropoff_lat: DEMO_COORDS.lat + 0.05,
        dropoff_lng: DEMO_COORDS.lng + 0.05,
        fare: chosenFare.estimated_fare,
        status: "pending",
        payment_reference: ref,
      })
      .select()
      .single();

    setLoading(false);
    if (!error && data) {
      setOrderId(data.id);
      setStep("success");
    }
  }

  const chosenFare = fares.find((f) => f.vehicle_type === selected);

  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center py-16 gap-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Ride booked!</h2>
        <p className="text-gray-500 max-w-sm">
          Your {selected} has been requested. A driver will be assigned shortly.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.push(`/orders/${orderId}`)}>Track Order</Button>
          <Button variant="outline" onClick={() => { setStep("form"); setPickup(""); setDropoff(""); }}>
            Book Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl w-full">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Book a Ride</h1>
      <p className="text-gray-500 mb-8">Choose your vehicle and set your route</p>

      {step === "form" && (
        <form onSubmit={handleEstimate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
          <Input
            label="Pickup location"
            placeholder="Enter pickup address"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            icon={<MapPin className="h-4 w-4 text-orange-400" />}
            required
          />
          <Input
            label="Drop-off location"
            placeholder="Enter destination"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            icon={<Navigation className="h-4 w-4 text-gray-400" />}
            required
          />
          <Button type="submit" size="lg">
            See available vehicles
          </Button>
        </form>
      )}

      {(step === "select" || step === "confirm") && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Route</p>
            <p className="font-medium text-gray-900 text-sm">{pickup} → {dropoff}</p>
          </div>

          <div className="flex flex-col gap-3">
            {fares.map((fare) => (
              <button
                key={fare.vehicle_type}
                onClick={() => setSelected(fare.vehicle_type)}
                className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  selected === fare.vehicle_type
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-100 bg-white hover:border-orange-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{fare.icon}</span>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{fare.label}</p>
                    <p className="text-xs text-gray-500">{fare.eta_minutes} min away</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(fare.estimated_fare)}</p>
                  <p className="text-xs text-gray-400">estimated</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
              Change route
            </Button>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-12 px-4 sm:px-6">
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
          <RideBookingForm />
        </Suspense>
      </div>
    </div>
  );
}
