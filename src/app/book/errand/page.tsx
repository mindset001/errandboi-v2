"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ErrandItem } from "@/types";
import { formatCurrency, generateReference } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PlacesAutocomplete from "@/components/ui/PlacesAutocomplete";

export const dynamic = "force-dynamic";

interface Location { address: string; lat: number; lng: number }

const COMMON_MARKETS = [
  "Computer Village, Ikeja",
  "Balogun Market, Lagos Island",
  "Mile 12 Market, Kosofe",
  "Mushin Market",
  "Tejuosho Market, Yaba",
  "Oshodi Market",
];

const SERVICE_FEE = 500;

export default function ErrandPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [market, setMarket] = useState("");
  const [delivery, setDelivery] = useState<Location>({ address: "", lat: 0, lng: 0 });
  const [items, setItems] = useState<ErrandItem[]>([{ name: "", quantity: 1 }]);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email! });
    });
  }, []);

  function addItem() { setItems([...items, { name: "", quantity: 1 }]); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: keyof ErrandItem, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  const itemsTotal = items.reduce((sum, it) => sum + (it.estimated_price || 0) * it.quantity, 0);
  const total = itemsTotal + SERVICE_FEE;

  function handleReview(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!user) { router.push("/auth/login"); return; }
    if (items.some((it) => !it.name)) return;
    setStep("review");
  }

  async function handleSubmit() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "errand",
        market_name: market,
        delivery_address: delivery.address,
        delivery_lat: delivery.lat || 6.5244,
        delivery_lng: delivery.lng || 3.3792,
        items,
        budget: Number(budget) || 0,
        service_fee: SERVICE_FEE,
        total,
        notes,
        status: "pending",
        payment_reference: generateReference(),
        items_payment_reference: itemsTotal > 0 ? generateReference() : null,
      })
      .select().single();
    setLoading(false);
    if (error) { setBookingError(error.message || "Failed to place order. Please try again."); return; }
    if (data) { setOrderId(data.id); setStep("success"); }
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center py-20 px-4 gap-6">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Errand submitted!</h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-sm">
          An Errandboi agent will head to {market} and get your items.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.push(`/orders/${orderId}`)}>Track Errand</Button>
          <Button variant="outline" onClick={() => { setStep("form"); setItems([{ name: "", quantity: 1 }]); }}>
            New Errand
          </Button>
        </div>
      </div>
    );
  }

  const inputBase = "w-full rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:bg-white focus:ring-orange-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-orange-400 dark:focus:bg-slate-800 dark:focus:ring-orange-900/40";

  return (
    <div className="py-12 px-4 sm:px-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mb-2">Send Errandboi to Market</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Tell us what you need, we&apos;ll shop and deliver to your door.</p>

        {step === "form" && (
          <form onSubmit={handleReview} className="flex flex-col gap-6">
            {/* Market & Delivery */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900 dark:text-slate-100">Market & Delivery</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-2">Select market</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {COMMON_MARKETS.map((m) => (
                    <button key={m} type="button" onClick={() => setMarket(m)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        market === m
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"
                          : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-orange-200 dark:hover:border-orange-500/40"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Input placeholder="Or type a market name..." value={market} onChange={(e) => setMarket(e.target.value)} required />
              </div>

              <PlacesAutocomplete
                label="Delivery address"
                placeholder="Where should we deliver to?"
                defaultValue={delivery.address}
                icon={<MapPin className="h-4 w-4 text-orange-400" />}
                required
                onSelect={(p) => setDelivery(p)}
                onChange={(v) => setDelivery((prev) => ({ ...prev, address: v }))}
              />
            </div>

            {/* Shopping list */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-orange-500" /> Shopping List
                </h2>
                <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-3 py-2.5 text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                  <span className="font-semibold">Be specific</span> — include brand, size, colour, or how ripe.<br />
                  <span className="text-orange-500/80 dark:text-orange-400/70">
                    e.g. &ldquo;Dangote Sugar 1kg&rdquo; · &ldquo;Tomatoes — 1 paint, very ripe&rdquo; · &ldquo;Indomie Chicken 70g × 5&rdquo;
                  </span>
                </div>
              </div>

              {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 pb-4 border-b border-gray-50 dark:border-slate-700/50 last:border-0 last:pb-0">
                  {/* Description row */}
                  <div className="flex gap-2 items-start">
                    <textarea
                      className={`${inputBase} flex-1 resize-none`}
                      rows={2}
                      placeholder={
                        i === 0 ? "e.g. Tomatoes — 1 paint, get the very ripe ones"
                        : i === 1 ? "e.g. Dangote Sugar — 1 kg pack"
                        : "Describe what to buy (brand, size, colour…)"
                      }
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      required
                    />
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <label className="text-xs text-gray-400 dark:text-slate-500">Qty</label>
                      <input
                        className={`${inputBase} w-16 text-center`}
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="mt-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {/* Estimated price — optional, below */}
                  <input
                    className={`${inputBase} w-48`}
                    type="number"
                    placeholder="Estimated price (₦) — optional"
                    value={item.estimated_price || ""}
                    onChange={(e) => updateItem(i, "estimated_price", Number(e.target.value))}
                  />
                </div>
              ))}

              <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-orange-500 dark:text-orange-400 font-medium hover:text-orange-600 dark:hover:text-orange-300">
                <Plus className="h-4 w-4" /> Add another item
              </button>
            </div>

            {/* Budget & Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900 dark:text-slate-100">Budget & Instructions</h2>
              <Input label="Total budget (₦)" type="number" placeholder="e.g. 10000" value={budget} onChange={(e) => setBudget(e.target.value)} />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Special instructions</label>
                <textarea className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/40 resize-none transition" rows={3} placeholder="e.g. Only buy fresh tomatoes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <Button type="submit" size="lg">Review Order</Button>
          </form>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4">Order Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Market</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{market}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Deliver to</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100 text-right max-w-[200px]">{delivery.address}</span>
                </div>
                <div className="border-t border-gray-50 dark:border-slate-700 pt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Items ({items.length})</p>
                  {items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600 dark:text-slate-300">{it.quantity}x {it.name}</span>
                      <span className="text-gray-500 dark:text-slate-400">{it.estimated_price ? formatCurrency(it.estimated_price * it.quantity) : "—"}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Items total (est.)</span>
                    <span className="text-gray-900 dark:text-slate-100">{formatCurrency(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Service fee</span>
                    <span className="text-gray-900 dark:text-slate-100">{formatCurrency(SERVICE_FEE)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-slate-100 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
            {bookingError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {bookingError}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Edit order</Button>
              <Button onClick={handleSubmit} loading={loading} className="flex-1">Place Errand</Button>
            </div>
          </div>
        )}
      </div>
  );
}
