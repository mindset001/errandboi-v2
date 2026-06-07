import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { OrderStatus } from "@/types";
import { updateOrderStatus, assignDriver } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "accepted", "in_progress", "completed", "cancelled"];

const statusStyle: Record<string, string> = {
  pending: "bg-yellow-400/10 text-yellow-400",
  accepted: "bg-blue-400/10 text-blue-400",
  in_progress: "bg-indigo-400/10 text-indigo-300",
  completed: "bg-green-400/10 text-green-400",
  cancelled: "bg-red-400/10 text-red-400",
};

const statusLabel: Record<string, string> = {
  pending: "Pending", accepted: "Accepted", in_progress: "In Progress",
  completed: "Completed", cancelled: "Cancelled",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status, type } = await searchParams;
  const supabase = createClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("order_type", type);

  const [{ data: orders }, { data: drivers }] = await Promise.all([
    query,
    supabase.from("drivers").select("id, full_name, vehicle_type, is_available").order("full_name"),
  ]);

  const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Orders</h1>
        <p className="text-slate-400 mt-1 text-sm">{orders?.length ?? 0} orders found</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <FilterLink label="All" href="/admin/orders" active={!status && !type} />
        <FilterLink label="Pending" href="/admin/orders?status=pending" active={status === "pending"} />
        <FilterLink label="Active" href="/admin/orders?status=in_progress" active={status === "in_progress"} />
        <FilterLink label="Completed" href="/admin/orders?status=completed" active={status === "completed"} />
        <FilterLink label="Cancelled" href="/admin/orders?status=cancelled" active={status === "cancelled"} />
        <span className="w-px bg-slate-700 mx-1" />
        <FilterLink label="Rides" href="/admin/orders?type=ride" active={type === "ride"} />
        <FilterLink label="Errands" href="/admin/orders?type=errand" active={type === "errand"} />
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Order", "Customer", "Details", "Amount", "Status", "Assign Driver", "Update Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-slate-700/30 transition">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-lg mr-1">
                      {order.order_type === "ride"
                        ? order.vehicle_type === "bike" ? "🏍️" : order.vehicle_type === "car" ? "🚗" : "🛺"
                        : "🛒"}
                    </span>
                    <span className="capitalize text-slate-200 font-medium">
                      {order.order_type === "ride" ? order.vehicle_type : "Errand"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-200 font-medium">
                      {profileMap.get(order.user_id)?.full_name ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profileMap.get(order.user_id)?.phone ?? ""}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-300 max-w-[160px] truncate">
                    {order.order_type === "ride"
                      ? `${order.pickup_address} → ${order.dropoff_address}`
                      : `${order.market_name} → ${order.delivery_address}`}
                  </td>
                  <td className="px-5 py-4 text-white font-semibold whitespace-nowrap">
                    {formatCurrency(order.fare || order.total || 0)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[order.status] ?? "bg-slate-700 text-slate-300"}`}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </td>

                  {/* Driver assignment */}
                  <td className="px-5 py-4">
                    <DriverAssignForm
                      orderId={order.id}
                      currentDriverId={order.driver_id ?? ""}
                      drivers={drivers ?? []}
                    />
                  </td>

                  {/* Status update */}
                  <td className="px-5 py-4">
                    <StatusUpdateForm orderId={order.id} current={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders?.length && (
            <div className="text-center py-16 text-slate-500">No orders found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a href={href} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
      active ? "bg-orange-500 text-white" : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-orange-500/50 hover:text-white"
    }`}>
      {label}
    </a>
  );
}

function DriverAssignForm({
  orderId,
  currentDriverId,
  drivers,
}: {
  orderId: string;
  currentDriverId: string;
  drivers: { id: string; full_name: string; vehicle_type: string; is_available: boolean }[];
}) {
  const vehicleIcon: Record<string, string> = { bike: "🏍️", car: "🚗", tricycle: "🛺" };

  return (
    <form action={async (fd: FormData) => {
      "use server";
      await assignDriver(orderId, fd.get("driver_id") as string);
    }} className="flex gap-1.5 items-center">
      <select
        name="driver_id"
        defaultValue={currentDriverId}
        className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-orange-400 max-w-[160px]"
      >
        <option value="">— Unassigned —</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {vehicleIcon[d.vehicle_type] ?? ""} {d.full_name} {d.is_available ? "" : "(offline)"}
          </option>
        ))}
      </select>
      <SubmitButton pendingText="…" className="rounded-lg bg-slate-600 hover:bg-orange-500 px-2 py-1.5 text-xs font-semibold text-white">
        Set
      </SubmitButton>
    </form>
  );
}

function StatusUpdateForm({ orderId, current }: { orderId: string; current: string }) {
  return (
    <form action={async (fd: FormData) => {
      "use server";
      await updateOrderStatus(orderId, fd.get("status") as OrderStatus);
    }} className="flex gap-1.5 items-center">
      <select name="status" defaultValue={current}
        className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 focus:outline-none focus:border-orange-400">
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{statusLabel[s]}</option>
        ))}
      </select>
      <SubmitButton pendingText="…" className="rounded-lg bg-orange-500 hover:bg-orange-600 px-2 py-1.5 text-xs font-semibold text-white">
        Save
      </SubmitButton>
    </form>
  );
}
