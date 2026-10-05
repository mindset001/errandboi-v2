"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminPassword, makeAdminToken, ADMIN_COOKIE, ADMIN_SESSION_SECONDS } from "@/lib/admin-auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function adminLogin(formData: FormData) {
  const password = formData.get("password");

  // 5 attempts per 15 minutes per IP
  if (!rateLimit(`admin-login:${clientIp(await headers())}`, 5, 15 * 60 * 1000)) {
    redirect("/admin/login?error=rate");
  }

  if (typeof password !== "string" || !checkAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });

  redirect("/admin/dashboard");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
