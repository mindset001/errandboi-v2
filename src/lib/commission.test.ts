import { describe, expect, it } from "vitest";
import { driverPayout, platformFee } from "@/lib/commission";

describe("commission split", () => {
  it("takes 15% for the platform and pays the driver 85%", () => {
    expect(platformFee(1000)).toBe(150);
    expect(driverPayout(1000)).toBe(850);
  });

  it("always splits an amount exactly — no naira created or lost to rounding", () => {
    for (let amount = 0; amount <= 5000; amount++) {
      expect(platformFee(amount) + driverPayout(amount)).toBe(amount);
    }
  });
});
