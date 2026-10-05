import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KYC_BUCKET, KYC_COLUMN, MAX_KYC_BYTES, sniffFile, signKycUrl, type KycSlot } from "@/lib/kyc";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const slot = formData.get("slot") as KycSlot;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!(slot in KYC_COLUMN)) return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  if (file.size > MAX_KYC_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffFile(bytes);
  if (!kind || (slot === "photo" && !kind.image)) {
    return NextResponse.json(
      { error: slot === "photo" ? "Please upload a JPG, PNG or WebP image." : "Please upload a JPG, PNG, WebP or PDF file." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: driver } = await admin
    .from("drivers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const column = KYC_COLUMN[slot];
  const path = `${driver.id}/${slot}.${kind.ext}`;

  const { data: existing } = await admin.from("driver_kyc").select(column).eq("driver_id", driver.id).maybeSingle();
  const previous = (existing as Record<string, string | null> | null)?.[column] ?? null;

  const { error: uploadError } = await admin.storage
    .from(KYC_BUCKET)
    .upload(path, bytes, { contentType: kind.mime, upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: dbError } = await admin
    .from("driver_kyc")
    .upsert({ driver_id: driver.id, [column]: path, updated_at: new Date().toISOString() }, { onConflict: "driver_id" });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Replaced a document with a different extension — drop the orphan.
  if (previous && previous !== path) await admin.storage.from(KYC_BUCKET).remove([previous]);

  return NextResponse.json({ url: await signKycUrl(admin, path) });
}
