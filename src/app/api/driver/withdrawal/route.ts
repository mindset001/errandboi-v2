import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { driverPayout } from "@/lib/commission";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, bank_name, account_number, account_name } = await req.json();

  if (!amount || !bank_name || !account_number || !account_name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) ||
      [bank_name, account_number, account_name].some((v) => typeof v !== "string")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (amount < 1000) {
    return NextResponse.json({ error: "Minimum withdrawal is ₦1,000" }, { status: 400 });
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver || driver.status !== "approved") {
    return NextResponse.json({ error: "Driver not approved" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Total earned from completed orders (only ever grows)
  const { data: orders } = await admin
    .from("orders")
    .select("fare, total")
    .eq("driver_id", driver.id)
    .eq("status", "completed");
  const earned = (orders ?? []).reduce((s, o) => s + driverPayout(o.fare ?? o.total ?? 0), 0);

  // The balance check + insert run in one locked transaction so concurrent
  // requests can't both pass (see supabase/security-hardening.sql).
  const { error } = await admin.rpc("request_withdrawal", {
    p_driver_id: driver.id,
    p_earned: earned,
    p_amount: Math.round(amount * 100) / 100,
    p_bank_name: bank_name.trim(),
    p_account_number: account_number.trim(),
    p_account_name: account_name.trim(),
  });

  if (error) {
    const m = /INSUFFICIENT_BALANCE:([\d.]+)/.exec(error.message);
    if (m) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ₦${Number(m[1]).toLocaleString("en-NG")}` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
