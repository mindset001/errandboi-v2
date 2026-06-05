"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { OrderStatus } from "@/types";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = createClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}

export async function assignDriver(orderId: string, driverId: string) {
  const supabase = createClient();
  await supabase
    .from("orders")
    .update({ driver_id: driverId || null, status: driverId ? "accepted" : "pending" })
    .eq("id", orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}
