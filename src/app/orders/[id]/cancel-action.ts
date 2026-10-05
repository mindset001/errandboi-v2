"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundOrder } from "@/lib/refunds";
import { notifyUser } from "@/lib/notify";

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
    .select("id, driver_id")
    .maybeSingle();

  if (error) return { error: "Could not cancel order" };
  if (!cancelled) return { error: "Order cannot be cancelled" };

  // If a driver had already accepted it, let them know it's off
  if (cancelled.driver_id) {
    const { data: driver } = await admin.from("drivers").select("auth_user_id").eq("id", cancelled.driver_id).maybeSingle();
    if (driver?.auth_user_id) {
      await notifyUser(driver.auth_user_id, {
        type: "order",
        title: "Order cancelled",
        body: "The customer cancelled an order you had accepted.",
        url: "/driver/dashboard",
      });
    }
  }

  // Anything the customer already paid goes back to them.
  const refund = await refundOrder(admin, orderId);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true, refundFailed: !refund.ok };
}
