import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const slot = formData.get("slot") as string;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!["license", "nin", "photo"].includes(slot)) return NextResponse.json({ error: "Invalid slot" }, { status: 400 });

  const admin = createAdminClient();

  const { data: driver } = await admin
    .from("drivers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${driver.id}/${slot}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("driver-kyc")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data } = admin.storage.from("driver-kyc").getPublicUrl(path);

  const column = slot === "license" ? "license_url" : slot === "nin" ? "nin_url" : "profile_photo_url";
  await admin.from("drivers").update({ [column]: data.publicUrl }).eq("id", driver.id);

  return NextResponse.json({ url: data.publicUrl });
}
