"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { VehicleType } from "@/types";

export async function toggleDriverAvailability(driverId: string, current: boolean) {
  const supabase = createClient();
  await supabase.from("drivers").update({ is_available: !current }).eq("id", driverId);
  revalidatePath("/admin/drivers");
}

export async function addDriver(formData: FormData) {
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
  const supabase = createClient();
  await supabase
    .from("drivers")
    .update({ status: "approved", is_available: false })
    .eq("id", driverId);
  revalidatePath("/admin/drivers");
}

export async function rejectDriver(driverId: string) {
  const supabase = createClient();
  await supabase
    .from("drivers")
    .update({ status: "rejected", is_available: false })
    .eq("id", driverId);
  revalidatePath("/admin/drivers");
}

export async function deleteDriver(driverId: string) {
  const supabase = createClient();
  await supabase.from("drivers").delete().eq("id", driverId);
  revalidatePath("/admin/drivers");
}
