"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only allow cancellation of pending or accepted orders
  const { data: order } = await supabase
    .from("orders")
    .select("status, user_id")
    .eq("id", orderId)
    .single();

  if (!order || order.user_id !== user.id) return { error: "Order not found" };
  if (!["pending", "accepted"].includes(order.status)) return { error: "Order cannot be cancelled" };

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true };
}
