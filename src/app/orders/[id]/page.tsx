import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const isRide = order.order_type === "ride";
  const statusSteps = ["pending", "accepted", "in_progress", "completed"];
  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ email: user.email! }} />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {isRide
                  ? order.vehicle_type === "bike" ? "🏍️" : order.vehicle_type === "car" ? "🚗" : "🛺"
                  : "🛒"}
              </span>
              <div>
                <h1 className="font-extrabold text-gray-900 text-xl capitalize">
                  {isRide ? `${order.vehicle_type} Ride` : `Market Errand`}
                </h1>
                <p className="text-sm text-gray-400">
                  {new Date(order.created_at).toLocaleString("en-NG")}
                </p>
              </div>
            </div>
            <Badge status={order.status} />
          </div>

          {/* Progress tracker */}
          {order.status !== "cancelled" && (
            <div className="flex items-center gap-1 mt-4">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${i <= currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                  {i < statusSteps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-0.5 ${i < currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">
            {isRide ? "Route Details" : "Errand Details"}
          </h2>

          {isRide ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500 mt-1" />
                  <div className="flex-1 w-0.5 bg-gray-200 my-1 min-h-[2rem]" />
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                </div>
                <div className="flex flex-col gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-400">Pickup</p>
                    <p className="font-medium text-gray-900">{order.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Drop-off</p>
                    <p className="font-medium text-gray-900">{order.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Market</span>
                <span className="font-medium text-gray-900">{order.market_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deliver to</span>
                <span className="font-medium text-gray-900 text-right max-w-[200px]">{order.delivery_address}</span>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Shopping list</p>
                  {order.items.map((item: { name: string; quantity: number; estimated_price?: number; note?: string }, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="text-gray-900">{item.quantity}x {item.name}</span>
                        {item.note && <span className="text-xs text-gray-400 ml-2">({item.note})</span>}
                      </div>
                      <span className="text-gray-500">
                        {item.estimated_price ? formatCurrency(item.estimated_price * item.quantity) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {order.notes && (
                <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
                  <span className="font-semibold">Note: </span>{order.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Payment</h2>
          <div className="flex flex-col gap-2">
            {isRide ? (
              <div className="flex justify-between font-bold text-gray-900">
                <span>Ride fare</span>
                <span>{formatCurrency(order.fare)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items (est.)</span>
                  <span>{formatCurrency(order.total - order.service_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service fee</span>
                  <span>{formatCurrency(order.service_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
