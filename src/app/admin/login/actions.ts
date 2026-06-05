"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminPassword, makeAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

export async function adminLogin(formData: FormData) {
  const password = formData.get("password") as string;

  if (!checkAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  redirect("/admin/dashboard");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
