import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signKycUrl } from "@/lib/kyc";
import DriverClient from "./DriverClient";

export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const { data: base } = await supabase
    .from("drivers")
    .select("id, full_name, phone, vehicle_type, vehicle_plate, rating, is_available, latitude, longitude, status")
    .eq("auth_user_id", user.id)
    .single();

  // Identity details and document paths live in driver_kyc (owner-only RLS).
  // Documents are private; hand the browser short-lived signed URLs.
  let driver = null;
  if (base) {
    const { data: kyc } = await supabase
      .from("driver_kyc")
      .select("license_number, nin, home_address, license_path, nin_path, photo_path")
      .eq("driver_id", base.id)
      .maybeSingle();
    const admin = createAdminClient();
    const [license_url, nin_url, profile_photo_url] = await Promise.all([
      signKycUrl(admin, kyc?.license_path),
      signKycUrl(admin, kyc?.nin_path),
      signKycUrl(admin, kyc?.photo_path),
    ]);
    driver = {
      ...base,
      license_number: kyc?.license_number ?? null,
      nin: kyc?.nin ?? null,
      home_address: kyc?.home_address ?? null,
      license_url,
      nin_url,
      profile_photo_url,
    };
  }

  if (!driver) {
    const admin = createAdminClient();
    const meta = user.user_metadata ?? {};
    const phone = meta.phone || "";

    // Never auto-claim an existing record by phone number: user_metadata is
    // user-controlled, so that would let anyone take over a driver's record.
    // Admins link existing drivers to accounts explicitly.
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
    .select("id, order_type, vehicle_type, pickup_address, dropoff_address, market_name, delivery_address, fare, total, budget, items, notes, status, created_at, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, delivery_lat, delivery_lng")
    .eq("driver_id", driver.id)
    .in("status", ["accepted", "in_progress"])
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
