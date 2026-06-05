import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { addDriver, toggleDriverAvailability, deleteDriver } from "./actions";
import { PlusCircle, Trash2 } from "lucide-react";

export default async function AdminDriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  const available = drivers?.filter((d) => d.is_available).length ?? 0;
  const total = drivers?.length ?? 0;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Drivers</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {available} available · {total - available} offline · {total} total
          </p>
        </div>
      </div>

      {/* Add driver form */}
      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
          <PlusCircle className="h-4 w-4" /> Add New Driver
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
            <button
              type="submit"
              className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
            >
              Add Driver
            </button>
          </div>
        </form>
      </details>

      {/* Drivers table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Driver", "Vehicle", "Plate", "Rating", "Status", "Toggle", "Remove"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {(drivers ?? []).map((driver) => (
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
                    <form action={toggleDriverAvailability.bind(null, driver.id, driver.is_available)}>
                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          driver.is_available
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        }`}
                      >
                        {driver.is_available ? "Set Offline" : "Set Available"}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-4">
                    <form action={deleteDriver.bind(null, driver.id)}>
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition"
                        title="Remove driver"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!drivers?.length && (
            <div className="text-center py-16 text-slate-500">No drivers yet. Add one above.</div>
          )}
        </div>
      </div>
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
