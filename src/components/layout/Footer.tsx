import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-slate-700/60 bg-white dark:bg-slate-900 py-8 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛵</span>
            <span className="font-extrabold text-orange-500">
              Errand<span className="text-gray-900 dark:text-slate-100">boi</span>
            </span>
          </div>
          <Link
            href="/driver/login"
            className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition"
          >
            🏍️ Are you a driver? Log in here
          </Link>
          <p className="text-sm text-gray-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} Errandboi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
