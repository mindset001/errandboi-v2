import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Verify driver identity via their session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Resolve driver record using session client (driver can read own row)
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver || driver.status !== "approved") {
    return NextResponse.json({ error: "Driver not approved" }, { status: 403 });
  }

  // Atomic accept via admin client — RLS blocks driver-session updates on
  // orders where driver_id IS NULL (the row doesn't belong to them yet).
  const admin = createAdminClient();
  const { data: updated } = await admin
    .from("orders")
    .update({ driver_id: driver.id, status: "accepted" })
    .eq("id", orderId)
    .eq("status", "pending")
    .is("driver_id", null)
    .select("id")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "Order already taken by another driver." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
