import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Phone, Star } from "lucide-react";
import RatingForm from "./RatingForm";
import TrackingMap from "./TrackingMap";
import { cancelOrder } from "./cancel-action";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: order }, { data: rating }] = await Promise.all([
    supabase.from("orders").select("*, drivers(id, full_name, phone, vehicle_type, vehicle_plate, rating, avatar_url, latitude, longitude)").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("ratings").select("stars, comment").eq("order_id", id).maybeSingle(),
  ]);

  if (!order) notFound();

  const isRide = order.order_type === "ride";
  const statusSteps = ["pending", "accepted", "in_progress", "completed"];
  const currentStep = statusSteps.indexOf(order.status);
  const canCancel = ["pending", "accepted"].includes(order.status);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {isRide
                  ? order.vehicle_type === "bike" ? "🏍️" : order.vehicle_type === "car" ? "🚗" : "🛺"
                  : "🛒"}
              </span>
              <div>
                <h1 className="font-extrabold text-gray-900 dark:text-slate-100 text-xl capitalize">
                  {isRide ? `${order.vehicle_type} Ride` : "Market Errand"}
                </h1>
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  {new Date(order.created_at).toLocaleString("en-NG")}
                </p>
              </div>
            </div>
            <Badge status={order.status} />
          </div>

          {order.status !== "cancelled" && (
            <div className="flex items-center gap-1 mt-4">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${i <= currentStep ? "bg-orange-500" : "bg-gray-200 dark:bg-slate-600"}`} />
                  {i < statusSteps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-0.5 ${i < currentStep ? "bg-orange-500" : "bg-gray-200 dark:bg-slate-600"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <form
              action={async () => {
                "use server";
                await cancelOrder(id);
              }}
              className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700"
            >
              <button
                type="submit"
                className="text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
              >
                Cancel this order
              </button>
            </form>
          )}
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
            {isRide ? "Route Details" : "Errand Details"}
          </h2>

          {isRide ? (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-orange-500 mt-1" />
                <div className="flex-1 w-0.5 bg-gray-200 dark:bg-slate-600 my-1 min-h-[2rem]" />
                <div className="h-3 w-3 rounded-full bg-gray-400 dark:bg-slate-500" />
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Pickup</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{order.pickup_address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Drop-off</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{order.dropoff_address}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Market</span>
                <span className="font-medium text-gray-900 dark:text-slate-100">{order.market_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Deliver to</span>
                <span className="font-medium text-gray-900 dark:text-slate-100 text-right max-w-[200px]">{order.delivery_address}</span>
              </div>
              {order.items?.length > 0 && (
                <div className="border-t border-gray-50 dark:border-slate-700 pt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Shopping list</p>
                  {order.items.map((item: { name: string; quantity: number; estimated_price?: number; note?: string }, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                      <div>
                        <span className="text-gray-900 dark:text-slate-100">{item.quantity}x {item.name}</span>
                        {item.note && <span className="text-xs text-gray-400 dark:text-slate-500 ml-2">({item.note})</span>}
                      </div>
                      <span className="text-gray-500 dark:text-slate-400">
                        {item.estimated_price ? formatCurrency(item.estimated_price * item.quantity) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {order.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Note: </span>{order.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live tracking map — shown while driver is on the way */}
        {order.drivers &&
          ["accepted", "in_progress"].includes(order.status) &&
          (order.pickup_lat || order.delivery_lat) && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 mb-4">
              <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-3">Live Tracking</h2>
              <TrackingMap
                driverId={order.drivers.id}
                pickupLat={order.pickup_lat ?? order.delivery_lat ?? 6.5244}
                pickupLng={order.pickup_lng ?? order.delivery_lng ?? 3.3792}
                initialDriverLat={order.drivers.latitude ?? null}
                initialDriverLng={order.drivers.longitude ?? null}
              />
            </div>
          )}

        {/* Driver card — shown once a driver is assigned */}
        {order.drivers && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 mb-4">
            <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4">Your Driver</h2>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {order.drivers.avatar_url
                  ? <img src={order.drivers.avatar_url} alt={order.drivers.full_name} className="h-full w-full object-cover" />
                  : (order.drivers.vehicle_type === "bike" ? "🏍️" : order.drivers.vehicle_type === "car" ? "🚗" : "🛺")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-slate-100 text-lg">{order.drivers.full_name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-yellow-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-yellow-500" />
                    {Number(order.drivers.rating).toFixed(1)}
                  </span>
                  <span className="text-gray-300 dark:text-slate-600">·</span>
                  <span className="text-sm text-gray-500 dark:text-slate-400 capitalize">{order.drivers.vehicle_type}</span>
                  <span className="text-gray-300 dark:text-slate-600">·</span>
                  <span className="text-sm font-mono text-gray-500 dark:text-slate-400">{order.drivers.vehicle_plate}</span>
                </div>
              </div>
              <a
                href={`tel:${order.drivers.phone}`}
                className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4">Payment</h2>
          <div className="flex flex-col gap-2">
            {isRide ? (
              <div className="flex justify-between font-bold text-gray-900 dark:text-slate-100">
                <span>Ride fare</span>
                <span>{formatCurrency(order.fare)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Items (est.)</span>
                  <span className="text-gray-900 dark:text-slate-100">{formatCurrency(order.total - order.service_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Service fee</span>
                  <span className="text-gray-900 dark:text-slate-100">{formatCurrency(order.service_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-slate-100 pt-2 border-t border-gray-100 dark:border-slate-700">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rating — only for completed orders */}
        {order.status === "completed" && (
          <RatingForm
            orderId={order.id}
            driverId={order.driver_id ?? null}
            existingRating={rating}
          />
        )}
      </div>
  );
}
