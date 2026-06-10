import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, orderType } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("user_id")
    .eq("id", orderId)
    .single();

  if (order) {
    const isRide = orderType === "ride";
    sendPushToUser(order.user_id, {
      title: isRide ? "🚗 Trip completed!" : "📦 Your items are here!",
      body: isRide
        ? "Your driver has ended the trip. Please confirm to release payment."
        : "Your errand agent has delivered your items. Please confirm receipt.",
      url: `/orders/${orderId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
