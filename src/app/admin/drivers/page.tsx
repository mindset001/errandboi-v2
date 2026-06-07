import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { addDriver, toggleDriverAvailability, deleteDriver, approveDriver, rejectDriver } from "./actions";
import { linkDriverAccount } from "./link-action";
import { PlusCircle, Trash2, Link, CheckCircle, XCircle } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = (drivers ?? []).filter((d) => d.status === "pending" && d.vehicle_plate && d.vehicle_plate !== "");
  const incompleteProfile = (drivers ?? []).filter((d) => !d.vehicle_plate || d.vehicle_plate === "");
  const approved = (drivers ?? []).filter((d) => d.status === "approved");
  const rejected = (drivers ?? []).filter((d) => d.status === "rejected");

  const available = approved.filter((d) => d.is_available).length;
  const total = approved.length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Drivers</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {available} available · {total - available} offline · {total} approved
            {pending.length > 0 && ` · ${pending.length} pending review`}
          </p>
        </div>
      </div>

      {/* Pending review — drivers who filled in their profile */}
      {pending.length > 0 && (
        <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-500/20">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
              Pending Review ({pending.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-500/20">
                  {["Driver", "Vehicle", "Plate", "License No.", "NIN", "Documents", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-amber-400/70 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {pending.map((driver) => (
                  <tr key={driver.id} className="hover:bg-amber-500/5 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-100">{driver.full_name}</p>
                      <p className="text-xs text-slate-500">{driver.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 capitalize">
                      {driver.vehicle_type === "bike" ? "🏍️ Bike" : driver.vehicle_type === "car" ? "🚗 Car" : "🛺 Keke"}
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-mono text-xs">{driver.vehicle_plate}</td>
                    <td className="px-5 py-4 text-slate-300 font-mono text-xs">{driver.license_number || "—"}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs">{driver.nin || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        {driver.license_url ? (
                          <a
                            href={driver.license_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
                          >
                            📄 License
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">No license doc</span>
                        )}
                        {driver.nin_url ? (
                          <a
                            href={driver.nin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
                          >
                            🪪 NIN / ID
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">No NIN doc</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <form action={approveDriver.bind(null, driver.id)}>
                          <SubmitButton
                            pendingText="Approving…"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 text-xs font-semibold"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </SubmitButton>
                        </form>
                        <form action={rejectDriver.bind(null, driver.id)}>
                          <SubmitButton
                            pendingText="Rejecting…"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-semibold"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers who signed up but haven't completed their profile */}
      {incompleteProfile.length > 0 && (
        <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Awaiting Profile Completion ({incompleteProfile.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {incompleteProfile.map((driver) => (
              <div key={driver.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-300 text-sm">{driver.full_name}</p>
                  <p className="text-xs text-slate-500">{driver.phone} · Signed up, profile not yet submitted</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add driver manually */}
      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
          <PlusCircle className="h-4 w-4" /> Add Driver Manually
        </summary>
        <form
          action={addDriver}
          className="mt-4 bg-slate-800 rounded-2xl border border-slate-700 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <DriverField name="full_name" label="Full name" placeholder="John Okafor" />
          <DriverField name="phone" label="Phone" placeholder="+234 800 000 0000" />
          <DriverField name="vehicle_plate" label="Vehicle plate" placeholder="ABC-123-XY" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Vehicle type</label>
            <select
              name="vehicle_type"
              required
              className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-slate-100 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40"
            >
              <option value="bike">🏍️ Bike</option>
              <option value="tricycle">🛺 Tricycle (Keke)</option>
              <option value="car">🚗 Car</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton
              pendingText="Adding…"
              className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Add Driver
            </SubmitButton>
          </div>
        </form>
      </details>

      {/* Approved drivers table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Approved Drivers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Driver", "Vehicle", "Plate", "Rating", "Status", "Account", "Toggle", "Remove"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {approved.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-700/30 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-100">{driver.full_name}</p>
                    <p className="text-xs text-slate-500">{driver.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-300 capitalize">
                    {driver.vehicle_type === "bike" ? "🏍️ Bike" : driver.vehicle_type === "car" ? "🚗 Car" : "🛺 Keke"}
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-mono text-xs">{driver.vehicle_plate}</td>
                  <td className="px-5 py-4 text-yellow-400 font-semibold">⭐ {Number(driver.rating).toFixed(1)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${driver.is_available ? "bg-green-400/10 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                      {driver.is_available ? "Available" : "Offline"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {driver.auth_user_id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                        <Link className="h-3.5 w-3.5" /> Linked
                      </span>
                    ) : (
                      <form action={async (fd: FormData) => {
                        "use server";
                        await linkDriverAccount(driver.id, fd.get("email") as string);
                      }} className="flex gap-1.5 items-center">
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="driver@email.com"
                          className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-orange-400 w-36 placeholder-slate-500"
                        />
                        <SubmitButton pendingText="Linking…" className="rounded-lg bg-slate-600 hover:bg-orange-500 px-2 py-1.5 text-xs font-semibold text-white whitespace-nowrap">
                          Link
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <form action={toggleDriverAvailability.bind(null, driver.id, driver.is_available)}>
                      <SubmitButton
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          driver.is_available
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        }`}
                      >
                        {driver.is_available ? "Set Offline" : "Set Available"}
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="px-5 py-4">
                    <form action={deleteDriver.bind(null, driver.id)}>
                      <SubmitButton
                        className="rounded-lg p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                        title="Remove driver"
                      >
                        <Trash2 className="h-4 w-4" />
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {approved.length === 0 && (
            <div className="text-center py-16 text-slate-500">No approved drivers yet.</div>
          )}
        </div>
      </div>

      {/* Rejected drivers */}
      {rejected.length > 0 && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Rejected ({rejected.length})</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {rejected.map((driver) => (
              <div key={driver.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-400 text-sm">{driver.full_name}</p>
                  <p className="text-xs text-slate-600">{driver.phone}</p>
                </div>
                <form action={approveDriver.bind(null, driver.id)}>
                  <SubmitButton pendingText="Approving…" className="text-xs text-green-400 hover:text-green-300">
                    Re-approve
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DriverField({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        required
        className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
      />
    </div>
  );
}
