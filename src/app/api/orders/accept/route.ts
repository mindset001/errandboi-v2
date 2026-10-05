import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";

export async function POST(req: NextRequest) {
  // Verify driver identity via their session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Resolve driver record using session client (driver can read own row)
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver || driver.status !== "approved") {
    return NextResponse.json({ error: "Driver not approved" }, { status: 403 });
  }

  // One active order at a time. (The unique index orders_one_active_per_driver
  // enforces this even if two accepts race; this check just gives a clear message.)
  const BUSY = { error: "Finish your current order before accepting another.", code: "driver_busy" };
  const { count: active } = await createAdminClient()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", driver.id)
    .in("status", ["accepted", "in_progress"]);
  if ((active ?? 0) > 0) return NextResponse.json(BUSY, { status: 409 });

  // Atomic accept via admin client — RLS blocks driver-session updates on
  // orders where driver_id IS NULL (the row doesn't belong to them yet).
  const admin = createAdminClient();
  const { data: updated, error: acceptError } = await admin
    .from("orders")
    .update({ driver_id: driver.id, status: "accepted" })
    .eq("id", orderId)
    .eq("status", "pending")
    .is("driver_id", null)
    .select("id")
    .maybeSingle();

  if (acceptError?.code === "23505") return NextResponse.json(BUSY, { status: 409 });

  if (!updated) {
    return NextResponse.json({ error: "Order already taken by another driver." }, { status: 409 });
  }

  // Notify the customer
  const { data: order } = await admin
    .from("orders")
    .select("user_id, order_type, vehicle_type")
    .eq("id", orderId)
    .single();

  if (order) {
    const isRide = order.order_type === "ride";
    await notifyUser(order.user_id, {
      type: "order",
      title: isRide ? "🏍️ Driver on the way!" : "🛒 Agent assigned!",
      body: isRide
        ? `Your ${order.vehicle_type} is on the way. Track your ride.`
        : "An Errandboi agent has been assigned to your errand.",
      url: `/orders/${orderId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
