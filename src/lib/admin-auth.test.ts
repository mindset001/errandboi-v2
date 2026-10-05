import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAdminPassword, makeAdminToken, verifyAdminToken } from "@/lib/admin-auth";

beforeEach(() => {
  process.env.ADMIN_SECRET = "a-long-enough-test-secret";
  process.env.ADMIN_PASSWORD = "correct horse";
});
afterEach(() => vi.useRealTimers());

describe("admin session token", () => {
  it("verifies a freshly issued token", () => {
    expect(verifyAdminToken(makeAdminToken())).toBe(true);
  });

  it("rejects missing, malformed and tampered tokens", () => {
    expect(verifyAdminToken(undefined)).toBe(false);
    expect(verifyAdminToken("")).toBe(false);
    expect(verifyAdminToken("garbage")).toBe(false);
    const [exp, mac] = makeAdminToken().split(".");
    expect(verifyAdminToken(`${Number(exp) + 999_999_999}.${mac}`)).toBe(false); // extended expiry
    const flipped = mac.slice(0, -1) + (mac.endsWith("0") ? "1" : "0");
    expect(verifyAdminToken(`${exp}.${flipped}`)).toBe(false); // altered signature
  });

  it("expires", () => {
    vi.useFakeTimers();
    const token = makeAdminToken();
    vi.advanceTimersByTime(8 * 60 * 60 * 1000 + 1000);
    expect(verifyAdminToken(token)).toBe(false);
  });

  it("is invalidated by rotating the secret", () => {
    const token = makeAdminToken();
    process.env.ADMIN_SECRET = "a-different-long-secret";
    expect(verifyAdminToken(token)).toBe(false);
  });

  it("refuses to run with a weak or missing secret", () => {
    process.env.ADMIN_SECRET = "short";
    expect(() => makeAdminToken()).toThrow();
    delete process.env.ADMIN_SECRET;
    expect(() => makeAdminToken()).toThrow();
  });
});

describe("checkAdminPassword", () => {
  it("accepts only the exact password", () => {
    expect(checkAdminPassword("correct horse")).toBe(true);
    expect(checkAdminPassword("correct horse ")).toBe(false);
    expect(checkAdminPassword("")).toBe(false);
  });

  it("fails closed when no password is configured", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(checkAdminPassword("")).toBe(false);
    expect(checkAdminPassword("anything")).toBe(false);
  });
});
