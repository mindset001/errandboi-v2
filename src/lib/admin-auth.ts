import { createHmac } from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export function makeAdminToken(): string {
  return createHmac("sha256", ADMIN_SECRET).update(ADMIN_PASSWORD).digest("hex");
}

export function verifyAdminToken(token: string): boolean {
  const expected = makeAdminToken();
  return token === expected;
}

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export const ADMIN_COOKIE = "errandboi_admin";
