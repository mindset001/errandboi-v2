import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseDriverProfile, saveDriverProfile } from "@/lib/kyc";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const input = parseDriverProfile(await req.json().catch(() => ({})));
  if (!input) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });

  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const error = await saveDriverProfile(createAdminClient(), driver.id, input);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
