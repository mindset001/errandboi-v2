"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { VehicleType } from "@/types";
import { notifyUser } from "@/lib/notify";
import { requireAdmin } from "@/lib/admin-guard";

async function notifyDriver(driverId: string, title: string, body: string) {
  const { data } = await createClient().from("drivers").select("auth_user_id").eq("id", driverId).maybeSingle();
  if (data?.auth_user_id) await notifyUser(data.auth_user_id, { type: "account", title, body, url: "/driver/dashboard" });
}

export async function toggleDriverAvailability(driverId: string, current: boolean) {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from("drivers").update({ is_available: !current }).eq("id", driverId);
  revalidatePath("/admin/drivers");
}

export async function addDriver(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from("drivers").insert({
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string,
    vehicle_type: formData.get("vehicle_type") as VehicleType,
    vehicle_plate: formData.get("vehicle_plate") as string,
    is_available: true,
    rating: 5.0,
    status: "approved",
  });
  revalidatePath("/admin/drivers");
}

export async function approveDriver(driverId: string) {
  await requireAdmin();
  const supabase = createClient();
  await supabase
    .from("drivers")
    .update({ status: "approved", is_available: false })
    .eq("id", driverId);
  await notifyDriver(driverId, "🎉 You're approved!", "Your driver account has been approved. You can now go online and accept orders.");
  revalidatePath("/admin/drivers");
}

export async function rejectDriver(driverId: string) {
  await requireAdmin();
  const supabase = createClient();
  await supabase
    .from("drivers")
    .update({ status: "rejected", is_available: false })
    .eq("id", driverId);
  await notifyDriver(driverId, "Application not approved", "Your driver application was not approved. Please contact support for more information.");
  revalidatePath("/admin/drivers");
}

export async function deleteDriver(driverId: string) {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from("drivers").delete().eq("id", driverId);
  revalidatePath("/admin/drivers");
}
