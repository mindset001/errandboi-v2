import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Completing an order credits the driver, so it must be paid for first.
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("orders")
    .select("total, service_fee, payment_status, items_payment_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const itemsDue = Number(current.total ?? 0) - Number(current.service_fee ?? 500) > 0;
  if (current.payment_status !== "paid" || (itemsDue && current.items_payment_status !== "paid")) {
    return NextResponse.json({ error: "Please complete payment before confirming" }, { status: 402 });
  }

  const { data, error } = await admin
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("status", "awaiting_confirmation")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Order not found or already completed" }, { status: 404 });

  // Notify the driver
  const { data: order } = await admin
    .from("orders")
    .select("driver_id, order_type, drivers(auth_user_id)")
    .eq("id", orderId)
    .single();

  if (order?.drivers) {
    const driverAuthId = (order.drivers as unknown as { auth_user_id: string }).auth_user_id;
    sendPushToUser(driverAuthId, {
      title: "✅ Delivery confirmed!",
      body: order.order_type === "errand"
        ? "The customer confirmed receipt. Your earnings have been credited."
        : "Trip confirmed by the customer. Great job!",
      url: "/driver/dashboard",
    });
  }

  return NextResponse.json({ ok: true });
}
