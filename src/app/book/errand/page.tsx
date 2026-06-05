"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ErrandItem } from "@/types";
import { formatCurrency, generateReference } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [items, setItems] = useState<ErrandItem[]>([{ name: "", quantity: 1, estimated_price: undefined, note: "" }]);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email! });
    });
  }, []);

  function addItem() {
    setItems([...items, { name: "", quantity: 1, estimated_price: undefined, note: "" }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof ErrandItem, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  const itemsTotal = items.reduce((sum, it) => sum + (it.estimated_price || 0) * it.quantity, 0);
  const total = itemsTotal + SERVICE_FEE;

  function handleReview(e: React.FormEvent) {
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
        delivery_address: deliveryAddress,
        delivery_lat: 6.5244,
        delivery_lng: 3.3792,
        items,
        budget: Number(budget) || 0,
        service_fee: SERVICE_FEE,
        total,
        notes,
        status: "pending",
        payment_reference: generateReference(),
      })
      .select()
      .single();

    setLoading(false);
    if (!error && data) {
      setOrderId(data.id);
      setStep("success");
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center text-center py-20 px-4 gap-6">
          <div className="text-6xl">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900">Errand submitted!</h2>
          <p className="text-gray-500 max-w-sm">
            An Errandboi agent will head to {market} and get your items. You&apos;ll be notified when they&apos;re on the way.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => router.push(`/orders/${orderId}`)}>Track Errand</Button>
            <Button variant="outline" onClick={() => { setStep("form"); setItems([{ name: "", quantity: 1 }]); }}>
              New Errand
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-12 px-4 sm:px-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Send Errandboi to Market</h1>
        <p className="text-gray-500 mb-8">
          Tell us what you need, we'll shop and deliver to your door.
        </p>

        {step === "form" && (
          <form onSubmit={handleReview} className="flex flex-col gap-6">
            {/* Market selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900">Market & Delivery</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Select market</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {COMMON_MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarket(m)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        market === m
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-gray-200 text-gray-600 hover:border-orange-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Or type a market name..."
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Delivery address"
                placeholder="Where should we deliver to?"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                icon={<MapPin className="h-4 w-4 text-orange-400" />}
                required
              />
            </div>

            {/* Shopping list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" /> Shopping List
              </h2>

              {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder={`Item ${i + 1} name`}
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      required
                    />
                    <input
                      className="w-20 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 text-center"
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      type="number"
                      placeholder="Estimated price (₦) optional"
                      value={item.estimated_price || ""}
                      onChange={(e) => updateItem(i, "estimated_price", Number(e.target.value))}
                    />
                    <input
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Note (optional)"
                      value={item.note || ""}
                      onChange={(e) => updateItem(i, "note", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600"
              >
                <Plus className="h-4 w-4" /> Add another item
              </button>
            </div>

            {/* Budget & Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900">Budget & Instructions</h2>
              <Input
                label="Total budget (₦)"
                type="number"
                placeholder="e.g. 10000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Special instructions</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                  rows={3}
                  placeholder="e.g. Only buy fresh tomatoes, check the size of the stockfish..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" size="lg">
              Review Order
            </Button>
          </form>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Market</span>
                  <span className="font-medium text-gray-900">{market}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deliver to</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px]">{deliveryAddress}</span>
                </div>
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items ({items.length})</p>
                  {items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{it.quantity}x {it.name}</span>
                      <span className="text-gray-500">
                        {it.estimated_price ? formatCurrency(it.estimated_price * it.quantity) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items total (est.)</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service fee</span>
                    <span>{formatCurrency(SERVICE_FEE)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                Edit order
              </Button>
              <Button onClick={handleSubmit} loading={loading} className="flex-1">
                Place Errand
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
