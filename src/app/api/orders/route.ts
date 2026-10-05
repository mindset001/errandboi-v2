import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estimateFares } from "@/lib/utils";
import { getRouteDistanceKm } from "@/lib/route";
import { SERVICE_FEE } from "@/lib/payments";
import type { VehicleType } from "@/types";

const VEHICLES: VehicleType[] = ["bike", "tricycle", "car"];

function reference() {
  return `ERRND-${Date.now()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function text(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null;
}

function coord(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

// Orders are priced and inserted here with the service role. Clients can't
// write to `orders` directly (see supabase/security-hardening.sql), so fare,
// total, status and payment fields can't be chosen by the caller.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.order_type === "ride") {
    const vehicle = body.vehicle_type as VehicleType;
    const pickup = text(body.pickup_address, 300);
    const dropoff = text(body.dropoff_address, 300);
    const pLat = coord(body.pickup_lat, -90, 90);
    const pLng = coord(body.pickup_lng, -180, 180);
    const dLat = coord(body.dropoff_lat, -90, 90);
    const dLng = coord(body.dropoff_lng, -180, 180);

    if (!VEHICLES.includes(vehicle) || !pickup || !dropoff ||
        pLat === null || pLng === null || dLat === null || dLng === null) {
      return NextResponse.json({ error: "Invalid ride details" }, { status: 400 });
    }

    const distanceKm = Math.max(await getRouteDistanceKm(pLat, pLng, dLat, dLng), 0.5);
    const fare = estimateFares(distanceKm).find((f) => f.vehicle_type === vehicle)!.estimated_fare;

    const { data, error } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "ride",
        vehicle_type: vehicle,
        pickup_address: pickup,
        pickup_lat: pLat,
        pickup_lng: pLng,
        dropoff_address: dropoff,
        dropoff_lat: dLat,
        dropoff_lng: dLng,
        fare,
        status: "pending",
        payment_status: "unpaid",
        payment_reference: reference(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data }, { status: 201 });
  }

  if (body.order_type === "errand") {
    const market = text(body.market_name, 200);
    const delivery = text(body.delivery_address, 300);
    const lat = coord(body.delivery_lat, -90, 90);
    const lng = coord(body.delivery_lng, -180, 180);
    const rawItems: unknown = body.items;

    if (!market || !delivery || lat === null || lng === null ||
        !Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
      return NextResponse.json({ error: "Invalid errand details" }, { status: 400 });
    }

    const items: { name: string; quantity: number; estimated_price: number }[] = [];
    for (const it of rawItems) {
      const name = text(it?.name, 100);
      const quantity = it?.quantity;
      const price = it?.estimated_price ?? 0;
      if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 ||
          typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000) {
        return NextResponse.json({ error: "Invalid item in list" }, { status: 400 });
      }
      items.push({ name, quantity, estimated_price: price });
    }

    const itemsTotal = items.reduce((s, it) => s + it.estimated_price * it.quantity, 0);
    const budget = typeof body.budget === "number" && body.budget >= 0 && body.budget <= 10_000_000
      ? body.budget : 0;

    const { data, error } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "errand",
        market_name: market,
        delivery_address: delivery,
        delivery_lat: lat,
        delivery_lng: lng,
        items,
        budget,
        service_fee: SERVICE_FEE,
        total: itemsTotal + SERVICE_FEE,
        notes: text(body.notes, 1000),
        status: "pending",
        payment_status: "unpaid",
        payment_reference: reference(),
        items_payment_status: "unpaid",
        items_payment_reference: itemsTotal > 0 ? reference() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid order_type" }, { status: 400 });
}
