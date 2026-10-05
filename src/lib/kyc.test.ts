import { describe, expect, it } from "vitest";
import { parseDriverProfile, sniffFile } from "@/lib/kyc";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

describe("sniffFile", () => {
  it("recognises JPEG, PNG, WebP and PDF by content", () => {
    expect(sniffFile(bytes(0xff, 0xd8, 0xff, 0xe0))).toMatchObject({ ext: "jpg", image: true });
    expect(sniffFile(bytes(0x89, 0x50, 0x4e, 0x47))).toMatchObject({ ext: "png", image: true });
    expect(sniffFile(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toMatchObject({ ext: "webp" });
    expect(sniffFile(bytes(0x25, 0x50, 0x44, 0x46))).toMatchObject({ ext: "pdf", image: false });
  });

  it("rejects anything else, whatever its filename claims", () => {
    expect(sniffFile(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffFile(new TextEncoder().encode("#!/bin/sh\nrm -rf /"))).toBeNull();
    expect(sniffFile(new Uint8Array())).toBeNull();
  });
});

describe("parseDriverProfile", () => {
  const ok = { vehicle_type: "bike", vehicle_plate: " abc-123 ", license_number: "lsd-1", nin: "", home_address: "" };

  it("normalises valid input", () => {
    expect(parseDriverProfile(ok)).toEqual({
      vehicle_type: "bike", vehicle_plate: "ABC-123", license_number: "LSD-1", nin: null, home_address: null,
    });
  });

  it("rejects bad vehicle types, missing required fields and non-strings", () => {
    expect(parseDriverProfile({ ...ok, vehicle_type: "helicopter" })).toBeNull();
    expect(parseDriverProfile({ ...ok, vehicle_plate: "" })).toBeNull();
    expect(parseDriverProfile({ ...ok, license_number: 5 })).toBeNull();
    expect(parseDriverProfile({ ...ok, home_address: "x".repeat(301) })).toBeNull();
  });
});
