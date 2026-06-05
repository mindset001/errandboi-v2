"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Bike, ShoppingCart, PackageSearch, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/book/ride", label: "Book a Ride", icon: Bike },
  { href: "/book/errand", label: "Send Errandboi", icon: ShoppingCart },
  { href: "/orders", label: "My Orders", icon: PackageSearch },
];

export function UserDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function UserMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
              active
                ? "text-orange-500"
                : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "text-orange-500")} />
            <span>{label}</span>
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign out</span>
      </button>
    </>
  );
}

export function UserSignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
