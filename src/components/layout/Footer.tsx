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
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Fast. Reliable. Delivered. &copy; {new Date().getFullYear()} Errandboi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
