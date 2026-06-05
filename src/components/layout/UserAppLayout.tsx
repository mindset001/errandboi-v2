import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { UserDesktopNav, UserMobileNav, UserSignOutButton } from "./UserSidebarNav";

export default async function UserAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 z-30">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b border-gray-100 dark:border-slate-800 hover:opacity-80 transition">
          <span className="text-2xl">🛵</span>
          <span className="text-lg font-extrabold text-orange-500">
            Errand<span className="text-gray-900 dark:text-slate-100">boi</span>
          </span>
        </Link>

        {/* Nav links */}
        <UserDesktopNav />

        {/* User info + controls */}
        <div className="p-3 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-1">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
          </div>
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
            <UserSignOutButton />
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🛵</span>
          <span className="font-extrabold text-orange-500 text-sm">
            Errand<span className="text-gray-900 dark:text-slate-100">boi</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
        <UserMobileNav />
      </nav>
    </div>
  );
}
