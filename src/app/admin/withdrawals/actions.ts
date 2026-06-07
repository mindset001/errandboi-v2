"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markPaid(id: string, note: string) {
  const admin = createAdminClient();
  await admin.from("withdrawals").update({ status: "paid", admin_note: note || null }).eq("id", id);
  revalidatePath("/admin/withdrawals");
}

export async function rejectWithdrawal(id: string, note: string) {
  const admin = createAdminClient();
  await admin.from("withdrawals").update({ status: "rejected", admin_note: note || null }).eq("id", id);
  revalidatePath("/admin/withdrawals");
}
