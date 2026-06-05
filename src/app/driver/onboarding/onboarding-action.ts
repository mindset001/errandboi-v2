"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleType } from "@/types";

export async function submitDriverProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const vehicleType = formData.get("vehicle_type") as VehicleType;
  const vehiclePlate = (formData.get("vehicle_plate") as string).trim().toUpperCase();
  const licenseNumber = (formData.get("license_number") as string).trim().toUpperCase();
  const nin = (formData.get("nin") as string | null)?.trim() ?? "";

  const { error } = await supabase
    .from("drivers")
    .update({
      vehicle_type: vehicleType,
      vehicle_plate: vehiclePlate,
      license_number: licenseNumber,
      nin: nin || null,
    })
    .eq("auth_user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/driver/dashboard");
  redirect("/driver/dashboard");
}
