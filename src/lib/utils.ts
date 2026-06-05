import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { VehicleType, FareEstimate } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateReference(): string {
  return `ERRND-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const FARE_CONFIG: Record<VehicleType, { label: string; icon: string; base: number; perKm: number }> = {
  bike: { label: "Bike", icon: "🏍️", base: 500, perKm: 80 },
  tricycle: { label: "Tricycle (Keke)", icon: "🛺", base: 700, perKm: 100 },
  car: { label: "Car", icon: "🚗", base: 1200, perKm: 150 },
};

export function estimateFares(distanceKm: number): FareEstimate[] {
  const vehicles: VehicleType[] = ["bike", "tricycle", "car"];
  return vehicles.map((type) => {
    const config = FARE_CONFIG[type];
    const fare = config.base + config.perKm * distanceKm;
    const eta = Math.round(distanceKm / (type === "bike" ? 0.5 : type === "tricycle" ? 0.4 : 0.6));
    return {
      vehicle_type: type,
      label: config.label,
      icon: config.icon,
      base_fare: config.base,
      per_km: config.perKm,
      estimated_fare: Math.round(fare),
      eta_minutes: Math.max(5, eta),
    };
  });
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    accepted: "Driver Assigned",
    in_progress: "On the Way",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    in_progress: "bg-indigo-100 text-indigo-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
