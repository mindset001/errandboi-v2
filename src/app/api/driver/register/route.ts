import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { userId, fullName, phone } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const supabase = createAdminClient();

  // Idempotent — don't create a second row if one already exists
  const { data: existing } = await supabase
    .from("drivers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("drivers").insert({
    full_name: fullName || "Driver",
    phone: phone || "",
    vehicle_type: "bike",
    vehicle_plate: "",
    is_available: false,
    rating: 5.0,
    status: "pending",
    auth_user_id: userId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
