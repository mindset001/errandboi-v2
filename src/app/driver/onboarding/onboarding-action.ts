"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseDriverProfile, saveDriverProfile } from "@/lib/kyc";

export async function submitDriverProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const input = parseDriverProfile({
    vehicle_type: formData.get("vehicle_type"),
    vehicle_plate: formData.get("vehicle_plate"),
    license_number: formData.get("license_number"),
    nin: formData.get("nin"),
    home_address: formData.get("home_address"),
  });
  if (!input) throw new Error("Please check your details and try again.");

  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!driver) redirect("/driver/login");

  const error = await saveDriverProfile(createAdminClient(), driver.id, input);
  if (error) throw new Error(error);

  revalidatePath("/driver/dashboard");
  redirect("/driver/dashboard");
}
