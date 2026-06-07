import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { email, phone } = await req.json();
  const admin = createAdminClient();

  const errors: Record<string, string> = {};

  if (email) {
    const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (data) errors.email = "An account with this email already exists.";
  }

  if (phone) {
    const { data } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (data) errors.phone = "An account with this phone number already exists.";
  }

  return NextResponse.json(errors);
}
