"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient as createClient } from "@/lib/supabase/admin";

export async function linkDriverAccount(driverId: string, email: string) {
  const supabase = createClient();

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) return { error: "Failed to fetch users" };

  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return { error: "No account found with that email. Ask the driver to register first." };

  const { error: updateError } = await supabase
    .from("drivers")
    .update({ auth_user_id: user.id })
    .eq("id", driverId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/drivers");
  return { success: true };
}
