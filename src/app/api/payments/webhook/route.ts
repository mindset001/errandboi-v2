import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyPayment, type PaymentType } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, amount, currency, status } = event.data;
    if (typeof reference === "string" && /^[A-Za-z0-9_.=-]{6,100}$/.test(reference)) {
      const admin = createAdminClient();

      // Orders are created with their payment references up front, so the
      // webhook can settle a payment even if the customer's browser closed.
      const { data: order } = await admin
        .from("orders")
        .select(
          "id, order_type, status, fare, total, service_fee, payment_status, items_payment_status, payment_reference, items_payment_reference"
        )
        .or(`payment_reference.eq.${reference},items_payment_reference.eq.${reference}`)
        .maybeSingle();

      if (order) {
        const type: PaymentType = order.items_payment_reference === reference ? "items" : "order";
        const result = await applyPayment(admin, order, type, reference, { status, amount, currency });
        if (!result.ok) console.error(`[webhook] ${reference} rejected: ${result.error}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
