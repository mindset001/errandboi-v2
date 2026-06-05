import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPaystackPayment } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reference, orderId } = await req.json();
  if (!reference || !orderId) {
    return NextResponse.json({ error: "Missing reference or orderId" }, { status: 400 });
  }

  const verified = await verifyPaystackPayment(reference);
  if (!verified) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 402 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "paid", payment_reference: reference })
    .eq("id", orderId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
