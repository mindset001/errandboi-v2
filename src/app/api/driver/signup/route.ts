import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { email, password, fullName, phone } = await req.json();

  if (!email || !password || !fullName || !phone) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create user immediately confirmed — no verification email
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, role: "driver" },
  });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  const userId = userData.user.id;

  // Claim an existing unlinked row with the same phone (e.g. admin-added)
  const { data: unlinked } = await admin
    .from("drivers")
    .select("id")
    .eq("phone", phone)
    .is("auth_user_id", null)
    .maybeSingle();

  if (unlinked) {
    await admin.from("drivers").update({ auth_user_id: userId, status: "pending" }).eq("id", unlinked.id);
  } else {
    // Only insert if no row exists for this user yet
    const { data: existing } = await admin
      .from("drivers")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!existing) {
      await admin.from("drivers").insert({
        full_name: fullName,
        phone,
        vehicle_type: "bike",
        vehicle_plate: "",
        is_available: false,
        rating: 5.0,
        status: "pending",
        auth_user_id: userId,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
