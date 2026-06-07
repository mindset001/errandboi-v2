import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DriverClient from "./DriverClient";

export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, full_name, phone, vehicle_type, vehicle_plate, rating, is_available, latitude, longitude, status, license_number, nin, license_url, nin_url, profile_photo_url, home_address")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver) {
    const admin = createAdminClient();
    const meta = user.user_metadata ?? {};
    const phone = meta.phone || "";

    // Try to claim an existing unlinked row (e.g. admin-added or from before auth_user_id existed)
    if (phone) {
      const { data: unlinked } = await admin
        .from("drivers")
        .select("id")
        .eq("phone", phone)
        .is("auth_user_id", null)
        .maybeSingle();

      if (unlinked) {
        await admin
          .from("drivers")
          .update({ auth_user_id: user.id, status: "pending" })
          .eq("id", unlinked.id);
        redirect("/driver/onboarding");
      }
    }

    // No existing row — insert a fresh pending record
    const { error: insertError } = await admin.from("drivers").insert({
      full_name: meta.full_name || "Driver",
      phone,
      vehicle_type: "bike",
      vehicle_plate: "",
      is_available: false,
      rating: 5.0,
      status: "pending",
      auth_user_id: user.id,
    });

    if (insertError) {
      return (
        <Screen emoji="⚠️" title="Setup Error">
          Could not create your driver profile. Please contact support.
          <p className="text-slate-600 text-xs mt-2 font-mono break-all">{insertError.message}</p>
        </Screen>
      );
    }

    redirect("/driver/onboarding");
  }

  // Profile not yet completed — send to onboarding
  if (!driver.vehicle_plate || driver.vehicle_plate === "") {
    return (
      <Screen emoji="📋" title="Complete Your Profile">
        You need to fill in your vehicle and KYC details before you can start driving.
        <Link
          href="/driver/onboarding"
          className="mt-5 inline-block rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition"
        >
          Complete Profile →
        </Link>
      </Screen>
    );
  }

  if (driver.status === "rejected") {
    return (
      <Screen emoji="❌" title="Application Rejected">
        Your driver application was not approved. Please contact support for more information.
        <p className="text-slate-500 text-xs mt-2">{user.email}</p>
      </Screen>
    );
  }

  // Both pending and approved drivers see the dashboard
  // Pending drivers get a read-only view (can't go online or accept orders)
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("driver_id", driver.id)
    .in("status", ["pending", "accepted", "in_progress"])
    .order("created_at", { ascending: false });

  return (
    <DriverClient
      driver={driver}
      initialOrders={orders ?? []}
      pending={driver.status === "pending"}
    />
  );
}

function Screen({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">{emoji}</div>
        <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
        <div className="text-slate-400 text-sm">{children}</div>
      </div>
    </div>
  );
}
