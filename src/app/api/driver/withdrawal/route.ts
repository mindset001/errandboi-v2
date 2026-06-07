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

  // Calculate available balance
  const [{ data: orders }, { data: withdrawals }] = await Promise.all([
    admin.from("orders").select("fare, total").eq("driver_id", driver.id).eq("status", "completed"),
    admin.from("withdrawals").select("amount").eq("driver_id", driver.id).in("status", ["pending", "paid"]),
  ]);

  const earned = (orders ?? []).reduce((s, o) => s + driverPayout(o.fare ?? o.total ?? 0), 0);
  const committed = (withdrawals ?? []).reduce((s, w) => s + Number(w.amount), 0);
  const available = earned - committed;

  if (amount > available) {
    return NextResponse.json(
      { error: `Insufficient balance. Available: ₦${available.toLocaleString("en-NG")}` },
      { status: 400 }
    );
  }

  const { error } = await admin.from("withdrawals").insert({
    driver_id: driver.id,
    amount,
    bank_name: bank_name.trim(),
    account_number: account_number.trim(),
    account_name: account_name.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
