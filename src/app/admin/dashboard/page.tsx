import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { platformFee, driverPayout } from "@/lib/commission";
import { Package, Users, Truck, TrendingUp, Clock, CheckCircle, XCircle, Banknote, HandCoins } from "lucide-react";
import RevenueChart from "./RevenueChart";

export const dynamic = "force-dynamic";

function buildDailyData(orders: { created_at: string; fare: number | null; total: number | null }[]) {
  const days = 14;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
    const dayOrders = orders.filter((o) => o.created_at.slice(0, 10) === key);
    return {
      label,
      revenue: dayOrders.reduce((s, o) => s + (o.fare || o.total || 0), 0),
      orders: dayOrders.length,
    };
  });
}

function buildWeeklyData(orders: { created_at: string; fare: number | null; total: number | null }[]) {
  const weeks = 8;
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (weeks - 1 - i) * 7 - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const label = `${start.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`;
    const weekOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });
    return {
      label,
      revenue: weekOrders.reduce((s, o) => s + (o.fare || o.total || 0), 0),
      orders: weekOrders.length,
    };
  });
}

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [
    { count: totalOrders },
    { count: activeOrders },
    { count: completedOrders },
    { count: cancelledOrders },
    { count: totalUsers },
    { count: totalDrivers },
    { count: availableDrivers },
    { data: completedOrderRows },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["pending", "accepted", "in_progress"]),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("drivers").select("*", { count: "exact", head: true }).eq("is_available", true),
    supabase.from("orders").select("created_at, fare, total").eq("status", "completed"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const recentUserIds = [...new Set((recentOrders ?? []).map((o) => o.user_id))];
  const { data: recentProfiles } = recentUserIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", recentUserIds)
    : { data: [] };
  const recentProfileMap = new Map((recentProfiles ?? []).map((p) => [p.id, p]));

  const gmv = (completedOrderRows ?? []).reduce((s, o) => s + (o.fare || o.total || 0), 0);
  const platformRevenue = platformFee(gmv);
  const driverPayouts = driverPayout(gmv);
  const daily = buildDailyData(completedOrderRows ?? []);
  const weekly = buildWeeklyData(completedOrderRows ?? []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">Overview of all ErrandBoi activity</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Orders", value: totalOrders ?? 0, icon: Package, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Registered Users", value: totalUsers ?? 0, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Active Drivers", value: `${availableDrivers ?? 0} / ${totalDrivers ?? 0}`, icon: Truck, color: "text-orange-400", bg: "bg-orange-400/10" },
          { label: "Gross Volume (GMV)", value: formatCurrency(gmv), icon: TrendingUp, color: "text-slate-400", bg: "bg-slate-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue split */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Banknote className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(platformRevenue)}</p>
            <p className="text-xs text-green-400 mt-0.5">Platform Revenue <span className="text-slate-500">(15%)</span></p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
            <HandCoins className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(driverPayouts)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Driver Payouts <span className="text-slate-500">(85%)</span></p>
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <RevenueChart daily={daily} weekly={weekly} />

      {/* Order status breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Orders", value: activeOrders ?? 0, icon: Clock, color: "text-yellow-400" },
          { label: "Completed", value: completedOrders ?? 0, icon: CheckCircle, color: "text-green-400" },
          { label: "Cancelled", value: cancelledOrders ?? 0, icon: XCircle, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex items-center gap-4">
            <s.icon className={`h-8 w-8 ${s.color} flex-shrink-0`} />
            <div>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Type", "Customer", "Route / Market", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {(recentOrders ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-slate-700/30 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg">
                      {order.order_type === "ride"
                        ? order.vehicle_type === "bike" ? "🏍️" : order.vehicle_type === "car" ? "🚗" : "🛺"
                        : "🛒"}
                    </span>
                    <span className="ml-2 capitalize text-slate-200 font-medium">
                      {order.order_type === "ride" ? order.vehicle_type : "Errand"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {recentProfileMap.get(order.user_id)?.full_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate">
                    {order.order_type === "ride"
                      ? `${order.pickup_address} → ${order.dropoff_address}`
                      : order.market_name}
                  </td>
                  <td className="px-6 py-4 text-white font-semibold">
                    {formatCurrency(order.fare || order.total || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recentOrders?.length && (
            <div className="text-center py-12 text-slate-500">No orders yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-400/10 text-yellow-400",
    accepted: "bg-blue-400/10 text-blue-400",
    in_progress: "bg-indigo-400/10 text-indigo-300",
    completed: "bg-green-400/10 text-green-400",
    cancelled: "bg-red-400/10 text-red-400",
  };
  const labels: Record<string, string> = {
    pending: "Pending", accepted: "Accepted", in_progress: "In Progress",
    completed: "Completed", cancelled: "Cancelled",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-700 text-slate-300"}`}>
      {labels[status] ?? status}
    </span>
  );
}
