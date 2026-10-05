import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit } from "@/lib/rate-limit";

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows up to the max, then blocks", () => {
    const key = `t-${Math.random()}`;
    const results = Array.from({ length: 5 }, () => rateLimit(key, 3, 1000));
    expect(results).toEqual([true, true, true, false, false]);
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    rateLimit(a, 1, 1000);
    expect(rateLimit(a, 1, 1000)).toBe(false);
    expect(rateLimit(`b-${Math.random()}`, 1, 1000)).toBe(true);
  });

  it("opens a fresh window after the time passes", () => {
    vi.useFakeTimers();
    const key = `w-${Math.random()}`;
    rateLimit(key, 1, 1000);
    expect(rateLimit(key, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 1, 1000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });
  it("falls back to unknown", () => expect(clientIp(new Headers())).toBe("unknown"));
});
