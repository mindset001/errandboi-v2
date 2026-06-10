"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

async function getDriverAuthUserId(withdrawalId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("withdrawals")
    .select("driver_id, drivers(auth_user_id)")
    .eq("id", withdrawalId)
    .single();
  const d = data?.drivers as unknown as { auth_user_id: string } | null;
  return d?.auth_user_id ?? null;
}

export async function markPaid(id: string, note: string) {
  const admin = createAdminClient();
  await admin.from("withdrawals").update({ status: "paid", admin_note: note || null }).eq("id", id);
  revalidatePath("/admin/withdrawals");

  const authUserId = await getDriverAuthUserId(id);
  if (authUserId) {
    sendPushToUser(authUserId, {
      title: "💰 Withdrawal paid!",
      body: "Your withdrawal request has been processed and sent to your bank account.",
      url: "/driver/dashboard",
    });
  }
}

export async function rejectWithdrawal(id: string, note: string) {
  const admin = createAdminClient();
  await admin.from("withdrawals").update({ status: "rejected", admin_note: note || null }).eq("id", id);
  revalidatePath("/admin/withdrawals");

  const authUserId = await getDriverAuthUserId(id);
  if (authUserId) {
    sendPushToUser(authUserId, {
      title: "❌ Withdrawal rejected",
      body: note ? `Reason: ${note}` : "Your withdrawal request was not approved. Contact support for details.",
      url: "/driver/dashboard",
    });
  }
}
