import { describe, expect, it } from "vitest";
import { estimateFares, haversineDistance, timeAgo } from "@/lib/utils";

const fare = (km: number, type: string) =>
  estimateFares(km).find((f) => f.vehicle_type === type)!.estimated_fare;

describe("estimateFares", () => {
  it("prices each vehicle as base + perKm * distance", () => {
    expect(fare(5, "bike")).toBe(900);      // 500 + 80*5
    expect(fare(5, "tricycle")).toBe(1200); // 700 + 100*5
    expect(fare(5, "car")).toBe(1950);      // 1200 + 150*5
  });

  it("rounds fractional fares to whole naira", () => {
    expect(Number.isInteger(fare(3.37, "car"))).toBe(true);
  });

  it("uses the API duration for ETAs, with bikes faster than cars", () => {
    const etas = Object.fromEntries(estimateFares(10, 40).map((f) => [f.vehicle_type, f.eta_minutes]));
    expect(etas.car).toBe(40);
    expect(etas.bike).toBe(26);
  });

  it("never reports an ETA under 3 minutes", () => {
    for (const f of estimateFares(0.5, 1)) expect(f.eta_minutes).toBeGreaterThanOrEqual(3);
  });
});

describe("haversineDistance", () => {
  it("is zero for the same point", () => {
    expect(haversineDistance(6.5244, 3.3792, 6.5244, 3.3792)).toBe(0);
  });

  it("is roughly right for Lagos Island to Ikeja (~15 km)", () => {
    const km = haversineDistance(6.4541, 3.3947, 6.6018, 3.3515);
    expect(km).toBeGreaterThan(14);
    expect(km).toBeLessThan(19);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-05T12:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("describes recent times relatively", () => {
    expect(timeAgo(ago(10_000), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5m ago");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("3h ago");
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe("2d ago");
  });

  it("falls back to a short date after a week", () => {
    expect(timeAgo(ago(30 * 86_400_000), now)).toMatch(/Sep/);
  });

  it("never returns a negative time for a clock-skewed future date", () => {
    expect(timeAgo(new Date(now + 60_000).toISOString(), now)).toBe("just now");
  });
});
