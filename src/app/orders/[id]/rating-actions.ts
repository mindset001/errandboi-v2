"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitRating(orderId: string, driverId: string | null, stars: number, comment: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("ratings").insert({
    order_id: orderId,
    user_id: user.id,
    driver_id: driverId || null,
    stars,
    comment: comment.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}
