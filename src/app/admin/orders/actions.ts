"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { OrderStatus } from "@/types";
import { refundOrder } from "@/lib/refunds";
import { requireAdmin } from "@/lib/admin-guard";

const ORDER_STATUSES: OrderStatus[] = [
  "pending", "accepted", "in_progress", "awaiting_confirmation", "completed", "cancelled",
];

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) return;
  const supabase = createClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  if (status === "cancelled") await refundOrder(supabase, orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}

export async function assignDriver(orderId: string, driverId: string) {
  await requireAdmin();
  const supabase = createClient();
  // Fails (unique index) if that driver already has an active order — leave the order as is.
  await supabase
    .from("orders")
    .update({ driver_id: driverId || null, status: driverId ? "accepted" : "pending" })
    .eq("id", orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}

export async function retryRefund(orderId: string) {
  await requireAdmin();
  await refundOrder(createClient(), orderId, true);
  revalidatePath("/admin/orders");
}
