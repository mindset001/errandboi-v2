import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-auth";

/**
 * Call at the top of every admin server action. The proxy only guards
 * requests by URL, and a server action can be invoked via any route, so
 * each action must verify the session itself.
 */
export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!verifyAdminToken(store.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
}
