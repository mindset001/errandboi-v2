"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundOrder } from "@/lib/refunds";

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Only pending or accepted orders can be cancelled. The status condition is part
  // of the update, so a driver starting the trip at the same moment wins the race.
  const { data: cancelled, error } = await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .in("status", ["pending", "accepted"])
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not cancel order" };
  if (!cancelled) return { error: "Order cannot be cancelled" };

  // Anything the customer already paid goes back to them.
  const refund = await refundOrder(admin, orderId);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true, refundFailed: !refund.ok };
}
