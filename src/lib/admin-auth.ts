import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "errandboi_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8; // 8 hours

function secret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SECRET must be set (16+ characters)");
  return s;
}

function sign(expiresAt: string): string {
  return createHmac("sha256", secret()).update(`admin.${expiresAt}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Session token = "<expiry ms>.<HMAC>". Expires on its own; rotating ADMIN_SECRET revokes all sessions. */
export function makeAdminToken(): string {
  const expiresAt = String(Date.now() + ADMIN_SESSION_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiresAt, mac] = token.split(".");
  if (!expiresAt || !mac || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  return safeEqual(mac, sign(expiresAt));
}

/** Constant-time password check (compares fixed-length digests). */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  const h = (v: string) => createHash("sha256").update(v).digest("hex");
  return safeEqual(h(password), h(expected));
}
