import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DriverClient from "./DriverClient";

export default async function DriverDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const { data: driver } = await supabase
    .from("drivers")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver) {
    // Driver signed up before auto-create was in place — create their pending record now
    const admin = createAdminClient();
    const meta = user.user_metadata ?? {};
    await admin.from("drivers").insert({
      full_name: meta.full_name || "Driver",
      phone: meta.phone || "",
      vehicle_type: "bike",
      vehicle_plate: "",
      is_available: false,
      rating: 5.0,
      status: "pending",
      auth_user_id: user.id,
    });
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

  if (driver.status === "pending") {
    return (
      <Screen emoji="⏳" title="Under Review">
        Your profile has been submitted and is being reviewed by the admin.
        You&apos;ll be able to log in and start accepting orders once approved.
        <p className="text-slate-500 text-xs mt-2">{user.email}</p>
      </Screen>
    );
  }

  // status === "approved"
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("driver_id", driver.id)
    .in("status", ["pending", "accepted", "in_progress"])
    .order("created_at", { ascending: false });

  return <DriverClient driver={driver} initialOrders={orders ?? []} />;
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
