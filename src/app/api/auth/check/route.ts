import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Used by the signup form to flag duplicates early. It does reveal whether an
// email/phone is registered, so it is rate-limited per IP.
export async function POST(req: NextRequest) {
  if (!rateLimit(`auth-check:${clientIp(req.headers)}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const admin = createAdminClient();

  const errors: Record<string, string> = {};

  if (email && email.length <= 254) {
    const { data } = await admin.from("profiles").select("id").ilike("email", email.replace(/[%_]/g, "\\$&")).maybeSingle();
    if (data) errors.email = "An account with this email already exists.";
  }

  if (phone && phone.length <= 20) {
    const { data } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (data) errors.phone = "An account with this phone number already exists.";
  }

  return NextResponse.json(errors);
}
