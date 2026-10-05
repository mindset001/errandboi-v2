import type { SupabaseClient } from "@supabase/supabase-js";

export const KYC_BUCKET = "driver-kyc";
const SIGNED_URL_TTL = 60 * 60; // seconds

export type KycSlot = "license" | "nin" | "photo";

export const KYC_COLUMN: Record<KycSlot, "license_path" | "nin_path" | "photo_path"> = {
  license: "license_path",
  nin: "nin_path",
  photo: "photo_path",
};

/** Short-lived URL for a private KYC object. Service-role client required. */
export async function signKycUrl(admin: SupabaseClient, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await admin.storage.from(KYC_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

type Sniffed = { ext: string; mime: string; image: boolean };

/** Identify an upload by its magic bytes — never trust the filename or Content-Type. */
export function sniffFile(bytes: Uint8Array): Sniffed | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg", image: true };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png", image: true };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: "webp", mime: "image/webp", image: true };
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { ext: "pdf", mime: "application/pdf", image: false };
  return null;
}

export const MAX_KYC_BYTES = 5 * 1024 * 1024;

export interface DriverProfileInput {
  vehicle_type: string;
  vehicle_plate: string;
  license_number: string;
  nin: string | null;
  home_address: string | null;
}

const VEHICLES = ["bike", "tricycle", "car"];

/** Validates raw profile fields; returns null if anything is off. */
export function parseDriverProfile(raw: Record<string, unknown>): DriverProfileInput | null {
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim().length <= max ? v.trim() : null;
  const vehicle_type = str(raw.vehicle_type, 20);
  const vehicle_plate = str(raw.vehicle_plate, 20);
  const license_number = str(raw.license_number, 40);
  const nin = str(raw.nin ?? "", 20);
  const home_address = str(raw.home_address ?? "", 300);
  if (!vehicle_type || !VEHICLES.includes(vehicle_type) || !vehicle_plate || !license_number ||
      nin === null || home_address === null) return null;
  return {
    vehicle_type,
    vehicle_plate: vehicle_plate.toUpperCase(),
    license_number: license_number.toUpperCase(),
    nin: nin || null,
    home_address: home_address || null,
  };
}

/** Writes vehicle fields to `drivers` and identity fields to `driver_kyc`. */
export async function saveDriverProfile(
  admin: SupabaseClient,
  driverId: string,
  p: DriverProfileInput
): Promise<string | null> {
  const { error: e1 } = await admin
    .from("drivers")
    .update({ vehicle_type: p.vehicle_type, vehicle_plate: p.vehicle_plate })
    .eq("id", driverId);
  if (e1) return e1.message;

  const { error: e2 } = await admin.from("driver_kyc").upsert(
    {
      driver_id: driverId,
      license_number: p.license_number,
      nin: p.nin,
      home_address: p.home_address,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "driver_id" }
  );
  return e2 ? e2.message : null;
}
