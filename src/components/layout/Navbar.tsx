"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PushSubscriber from "@/components/PushSubscriber";

interface NavbarProps {
  user?: { email: string; full_name?: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🛵</span>
          <span className="text-xl font-extrabold text-orange-500">
            Errand<span className="text-gray-900 dark:text-slate-100">boi</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/book/ride" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition">
            Book a Ride
          </Link>
          <Link href="/book/errand" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition">
            Send Errandboi
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition">
                Dashboard
              </Link>
              <PushSubscriber />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/driver/login" className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition">
                🏍️ Driver Portal
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile: toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-1.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 md:hidden flex flex-col gap-4">
          <Link href="/book/ride" className="font-medium text-gray-700 dark:text-slate-200" onClick={() => setOpen(false)}>🏍️ Book a Ride</Link>
          <Link href="/book/errand" className="font-medium text-gray-700 dark:text-slate-200" onClick={() => setOpen(false)}>🛒 Send Errandboi</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="font-medium text-gray-700 dark:text-slate-200" onClick={() => setOpen(false)}>📊 Dashboard</Link>
              <button onClick={handleSignOut} className="text-left font-medium text-red-500">Sign out</button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link href="/driver/login" className="font-medium text-gray-600 dark:text-slate-300" onClick={() => setOpen(false)}>🏍️ Driver Portal</Link>
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setOpen(false)}>
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
