import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPaystackTransaction } from "@/lib/paystack";
import { applyPayment, type PaymentType } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reference, orderId, paymentType } = await req.json().catch(() => ({}));
  if (typeof reference !== "string" || typeof orderId !== "string") {
    return NextResponse.json({ error: "Missing reference or orderId" }, { status: 400 });
  }
  const type: PaymentType = paymentType === "items" ? "items" : "order";

  // Order must belong to the caller. Read with the service role since payment
  // columns are written server-side only.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, order_type, status, fare, total, service_fee, payment_status, items_payment_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const tx = await fetchPaystackTransaction(reference);
  if (!tx) return NextResponse.json({ error: "Payment verification failed" }, { status: 402 });

  // The popup tags the transaction with the order it was opened for.
  if (tx.metadata?.orderId !== orderId) {
    return NextResponse.json({ error: "Payment does not belong to this order" }, { status: 402 });
  }
  if ((tx.metadata?.paymentType === "items" ? "items" : "order") !== type) {
    return NextResponse.json({ error: "Payment type mismatch" }, { status: 402 });
  }

  const result = await applyPayment(admin, order, type, reference, tx);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true });
}
