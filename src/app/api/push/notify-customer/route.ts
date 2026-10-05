import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json().catch(() => ({}));
  if (typeof orderId !== "string") return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Only the driver assigned to this order may trigger the "delivered" push.
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("user_id, order_type")
    .eq("id", orderId)
    .eq("driver_id", driver.id)
    .eq("status", "awaiting_confirmation")
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isRide = order.order_type === "ride";
  sendPushToUser(order.user_id, {
    title: isRide ? "🚗 Trip completed!" : "📦 Your items are here!",
    body: isRide
      ? "Your driver has ended the trip. Please confirm to release payment."
      : "Your errand agent has delivered your items. Please confirm receipt.",
    url: `/orders/${orderId}`,
  });

  return NextResponse.json({ ok: true });
}
