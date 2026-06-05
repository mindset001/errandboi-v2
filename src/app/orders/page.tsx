import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mb-8">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 dark:text-slate-400 mb-6">You haven&apos;t placed any orders yet.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/book/ride" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
                🏍️ Book a Ride
              </Link>
              <Link href="/book/errand" className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500 px-5 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition">
                🛒 Send Errandboi
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 hover:shadow-md hover:border-orange-100 dark:hover:border-orange-500/40 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {order.order_type === "ride"
                          ? order.vehicle_type === "bike" ? "🏍️" : order.vehicle_type === "car" ? "🚗" : "🛺"
                          : "🛒"}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-slate-100 capitalize">
                          {order.order_type === "ride"
                            ? `${order.vehicle_type} Ride`
                            : `Market Errand — ${order.market_name}`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-NG", {
                            weekday: "short", day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge status={order.status} />
                      <p className="font-bold text-gray-900 dark:text-slate-100">
                        {formatCurrency(order.fare || order.total || 0)}
                      </p>
                    </div>
                  </div>

                  {order.order_type === "ride" && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50 text-sm text-gray-500 dark:text-slate-400">
                      <span className="font-medium text-gray-700 dark:text-slate-300">{order.pickup_address}</span> → {order.dropoff_address}
                    </div>
                  )}
                  {order.order_type === "errand" && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50 text-sm text-gray-500 dark:text-slate-400">
                      {order.items?.length} item(s) • Deliver to {order.delivery_address}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
  );
}
