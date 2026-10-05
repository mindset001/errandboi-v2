import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The only transitions a driver may make. "completed" is reserved for the
// customer's confirmation (/api/orders/confirm).
const NEXT: Record<string, string> = {
  accepted: "in_progress",
  in_progress: "awaiting_confirmation",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, status } = await req.json().catch(() => ({}));
  if (typeof orderId !== "string" || typeof status !== "string") {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .single();
  if (!driver || driver.status !== "approved") {
    return NextResponse.json({ error: "Driver not approved" }, { status: 403 });
  }

  const admin = createAdminClient();
  const from = Object.keys(NEXT).find((k) => NEXT[k] === status);
  if (!from) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { data, error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("driver_id", driver.id)
    .eq("status", from)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Order not found or in the wrong state" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
