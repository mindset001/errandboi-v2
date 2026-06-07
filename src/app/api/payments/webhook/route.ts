import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, amount, customer } = event.data;
    const admin = createAdminClient();

    await admin
      .from("orders")
      .update({ payment_status: "paid", payment_reference: reference })
      .eq("payment_reference", reference)
      .eq("payment_status", "unpaid");

    console.log(`[webhook] Payment confirmed: ${reference} ₦${amount / 100} ${customer?.email}`);
  }

  return NextResponse.json({ received: true });
}
