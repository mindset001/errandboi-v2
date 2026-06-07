import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitDriverProfile } from "./onboarding-action";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function DriverOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, full_name, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver) redirect("/driver/login");
  if (driver.status === "approved") redirect("/driver/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl mb-4">
            📋
          </div>
          <h1 className="text-2xl font-extrabold text-white">Complete Your Profile</h1>
          <p className="text-slate-400 text-sm mt-1">
            Hi {driver.full_name?.split(" ")[0]}! Fill in your vehicle and identity details to get started.
          </p>
        </div>

        <form
          action={submitDriverProfile}
          className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col gap-6"
        >
          {/* Vehicle section */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Vehicle Details</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Vehicle type</label>
                <select
                  name="vehicle_type"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
                >
                  <option value="">Select vehicle type</option>
                  <option value="bike">🏍️ Motorcycle / Bike</option>
                  <option value="tricycle">🛺 Tricycle (Keke)</option>
                  <option value="car">🚗 Car</option>
                </select>
              </div>
              <TextField name="vehicle_plate" label="Vehicle plate number" placeholder="ABC-123-XY" required />
            </div>
          </div>

          {/* Identity section */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Identity Details</h2>
            <div className="flex flex-col gap-4">
              <TextField name="license_number" label="Driver's license number" placeholder="e.g. LSD-02345-A" required />
              <TextField name="nin" label="NIN (optional)" placeholder="e.g. 12345678901" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Full home address</label>
                <textarea
                  name="home_address"
                  placeholder="e.g. 12 Bode Thomas Street, Surulere, Lagos"
                  rows={2}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition resize-none"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            After submitting, you can upload your license photo and NIN document from your dashboard. The admin will review everything before activating your account.
          </p>

          <SubmitButton
            pendingText="Submitting…"
            className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-3 font-semibold text-white"
          >
            Submit for Review →
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

function TextField({ name, label, placeholder, required }: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
      />
    </div>
  );
}
