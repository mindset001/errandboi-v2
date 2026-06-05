import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const completedOrders = orders?.filter((o) => o.status === "completed") ?? [];
  const totalSpent = completedOrders.reduce((sum, o) => sum + (o.fare || o.total || 0), 0);
  const activeOrder = orders?.find((o) => ["pending", "accepted", "in_progress"].includes(o.status));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
            Hey, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">What do you need today?</p>
        </div>

        {/* Active order alert */}
        {activeOrder && (
          <Link href={`/orders/${activeOrder.id}`}>
            <div className="mb-6 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-orange-100 dark:hover:bg-orange-500/15 transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">
                  {activeOrder.order_type === "ride" ? "🏍️" : "🛒"}
                </span>
                <div>
                  <p className="font-bold text-orange-700 dark:text-orange-400 text-sm">Active order</p>
                  <p className="text-xs text-orange-600 dark:text-orange-500">
                    {activeOrder.order_type === "ride"
                      ? `${activeOrder.vehicle_type} ride to ${activeOrder.dropoff_address}`
                      : `Errand at ${activeOrder.market_name}`}
                  </p>
                </div>
              </div>
              <Badge status={activeOrder.status} />
            </div>
          </Link>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Bike", icon: "🏍️", href: "/book/ride?type=bike" },
            { label: "Car", icon: "🚗", href: "/book/ride?type=car" },
            { label: "Keke", icon: "🛺", href: "/book/ride?type=tricycle" },
            { label: "Market", icon: "🛒", href: "/book/errand" },
          ].map((a) => (
            <Link key={a.label} href={a.href}>
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-5 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/40 transition cursor-pointer">
                <span className="text-3xl">{a.icon}</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total orders", value: orders?.length ?? 0 },
            { label: "Completed", value: completedOrders.length },
            { label: "Total spent", value: formatCurrency(totalSpent) },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 text-center">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-slate-100">Recent orders</h2>
            <Link href="/orders" className="text-sm font-medium text-orange-500 dark:text-orange-400 hover:underline">
              View all
            </Link>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-slate-500">
              <p>No orders yet. Book your first ride!</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-slate-700/50">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="flex items-center justify-between py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/40 -mx-2 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {order.order_type === "ride"
                          ? order.vehicle_type === "bike" ? "🏍️" : order.vehicle_type === "car" ? "🚗" : "🛺"
                          : "🛒"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 capitalize">
                          {order.order_type === "ride" ? `${order.vehicle_type} Ride` : `Errand — ${order.market_name}`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={order.status} />
                      <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        {formatCurrency(order.fare || order.total || 0)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
