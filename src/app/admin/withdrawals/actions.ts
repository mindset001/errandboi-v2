"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";
import { requireAdmin } from "@/lib/admin-guard";

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
  await requireAdmin();
  const admin = createAdminClient();
  // Only a pending request can be settled — never flip a finished one.
  const { data: changed } = await admin
    .from("withdrawals")
    .update({ status: "paid", admin_note: note || null })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  revalidatePath("/admin/withdrawals");
  if (!changed) return;

  const authUserId = await getDriverAuthUserId(id);
  if (authUserId) {
    await notifyUser(authUserId, {
      type: "withdrawal",
      title: "💰 Withdrawal paid!",
      body: "Your withdrawal request has been processed and sent to your bank account.",
      url: "/driver/dashboard",
    });
  }
}

export async function rejectWithdrawal(id: string, note: string) {
  await requireAdmin();
  const admin = createAdminClient();
  // Only a pending request can be settled — never flip a finished one.
  const { data: changed } = await admin
    .from("withdrawals")
    .update({ status: "rejected", admin_note: note || null })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  revalidatePath("/admin/withdrawals");
  if (!changed) return;

  const authUserId = await getDriverAuthUserId(id);
  if (authUserId) {
    await notifyUser(authUserId, {
      type: "withdrawal",
      title: "❌ Withdrawal rejected",
      body: note ? `Reason: ${note}` : "Your withdrawal request was not approved. Contact support for details.",
      url: "/driver/dashboard",
    });
  }
}
