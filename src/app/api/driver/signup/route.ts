import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;

export async function POST(req: NextRequest) {
  // 5 sign-ups per hour per IP
  if (!rateLimit(`driver-signup:${clientIp(req.headers)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!email || !password || !fullName || !phone) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: "Password must be 8–72 characters." }, { status: 400 });
  }
  if (fullName.length > 100 || !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Enter a valid name and phone number." }, { status: 400 });
  }

  const admin = createAdminClient();

  // A phone number already on a driver record belongs to that record. Never let a
  // new account take it over — an admin links existing drivers to accounts explicitly.
  const { data: taken } = await admin.from("drivers").select("id").eq("phone", phone).maybeSingle();
  if (taken) {
    return NextResponse.json(
      { error: "This phone number is already registered. Contact support to link your account." },
      { status: 409 }
    );
  }

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

  const { error: insertError } = await admin.from("drivers").insert({
    full_name: fullName,
    phone,
    vehicle_type: "bike",
    vehicle_plate: "",
    is_available: false,
    rating: 5.0,
    status: "pending",
    auth_user_id: userId,
  });

  if (insertError) {
    // Don't leave an account with no driver record behind
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Could not create your driver profile. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
