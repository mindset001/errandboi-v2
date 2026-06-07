export type VehicleType = "bike" | "car" | "tricycle";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled";

export type OrderType = "ride" | "errand";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  vehicle_type: VehicleType;
  vehicle_plate: string;
  avatar_url?: string;
  is_available: boolean;
  rating: number;
  latitude?: number;
  longitude?: number;
}

export interface RideOrder {
  id: string;
  user_id: string;
  driver_id?: string;
  order_type: "ride";
  vehicle_type: VehicleType;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  fare: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  driver?: Driver;
}

export interface ErrandItem {
  name: string;
  quantity: number;
  estimated_price?: number;
  note?: string;
}

export interface ErrandOrder {
  id: string;
  user_id: string;
  driver_id?: string;
  order_type: "errand";
  market_name: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  items: ErrandItem[];
  budget: number;
  service_fee: number;
  total: number;
  notes?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  driver?: Driver;
}

export type Order = RideOrder | ErrandOrder;

export interface FareEstimate {
  vehicle_type: VehicleType;
  label: string;
  icon: string;
  base_fare: number;
  per_km: number;
  estimated_fare: number;
  eta_minutes: number;
}

export interface PaystackConfig {
  reference: string;
  email: string;
  amount: number;
  publicKey: string;
}
