export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-8 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛵</span>
            <span className="font-extrabold text-orange-500">
              Errand<span className="text-gray-900">boi</span>
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Fast. Reliable. Delivered. &copy; {new Date().getFullYear()} Errandboi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
